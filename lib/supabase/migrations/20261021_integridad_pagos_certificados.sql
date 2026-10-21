-- =======================================================
-- EDDIP · Migración de integridad: pagos verificados, evaluaciones calificadas en el servidor
-- y validación pública de certificados sin exponer la cédula.
--
-- Requiere 20261021_auth_roles_rls.sql (funciones is_admin / is_staff).
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente).
-- =======================================================

BEGIN;

-- -------------------------------------------------------
-- 1. Órdenes de pago: el precio y el estado los fija solo el servidor (service role).
--    El estudiante puede consultar sus propias órdenes; nadie puede crearlas ni editarlas desde el cliente.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_orders (
  order_id TEXT PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  amount INT NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  coupon_code TEXT,
  provider TEXT NOT NULL DEFAULT 'Bold',
  payment_link_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'voided')),
  provider_payment_id TEXT,
  payment_method TEXT,
  approved_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS payment_orders_student_idx ON public.payment_orders (student_id);
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_payment_link_idx
  ON public.payment_orders (payment_link_id) WHERE payment_link_id IS NOT NULL;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_orders_select_owner_or_admin" ON public.payment_orders;
CREATE POLICY "payment_orders_select_owner_or_admin" ON public.payment_orders
  FOR SELECT USING (auth.uid() = student_id OR public.is_admin());

-- -------------------------------------------------------
-- 2. site_content: las evaluaciones (con sus respuestas correctas) y los certificados heredados
--    dejan de ser públicos. El personal académico conserva la lectura de las claves de cursos.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_private_site_content_key(content_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT content_key IN (
    'admin_students_list',
    'admin_sales_list',
    'eddip_registered_users',
    'eddip_deleted_user_emails',
    'manual_certificate_registrations',
    'password_reset_tokens',
    'notification_log',
    'admin_exams_list'
  )
  OR starts_with(content_key, 'exam_')
  OR starts_with(content_key, 'certificate_');
$$;

DROP POLICY IF EXISTS "site_content_select_public_or_admin" ON public.site_content;
DROP POLICY IF EXISTS "site_content_select_by_role" ON public.site_content;
CREATE POLICY "site_content_select_by_role" ON public.site_content
  FOR SELECT USING (
    NOT public.is_private_site_content_key(key)
    OR public.is_admin()
    OR (public.is_staff() AND public.is_course_site_content_key(key))
  );

-- Tabla heredada `exams` (si existe): solo el personal académico puede leerla o modificarla
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  IF to_regclass('public.exams') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY';
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exams' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.exams', policy_name);
    END LOOP;
    EXECUTE 'CREATE POLICY "exams_staff_all" ON public.exams FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff())';
  END IF;
END $$;

-- -------------------------------------------------------
-- 3. Certificados: se emiten solo desde el servidor (evaluación aprobada) o por un administrador.
--    La lectura directa queda limitada al titular y a la administración.
-- -------------------------------------------------------

-- Conserva como filas de la tabla los certificados que solo existían en site_content
INSERT INTO public.certificates (code, student_name, document_id, course_slug, course_title, hours, status, issue_date)
SELECT
  sc.value->>'code',
  COALESCE(NULLIF(sc.value->>'studentName', ''), NULLIF(sc.value->>'student', ''), 'Estudiante EDDIP'),
  NULLIF(sc.value->>'documentId', ''),
  COALESCE(sc.value->>'courseSlug', ''),
  COALESCE(NULLIF(sc.value->>'courseTitle', ''), NULLIF(sc.value->>'course', ''), 'Programa EDDIP'),
  CASE WHEN COALESCE(sc.value->>'hours', '') ~ '^[0-9]{1,5}$' THEN (sc.value->>'hours')::INT ELSE 40 END,
  CASE WHEN sc.value->>'status' = 'Revocado' THEN 'Revocado' ELSE 'Válido' END,
  COALESCE(NULLIF(sc.value->>'issueDate', ''), NULLIF(sc.value->>'date', ''), TO_CHAR(sc.updated_at, 'YYYY-MM-DD'))
FROM public.site_content sc
WHERE starts_with(sc.key, 'certificate_')
  AND jsonb_typeof(sc.value) = 'object'
  AND COALESCE(sc.value->>'code', '') <> ''
  AND NOT EXISTS (SELECT 1 FROM public.certificates c WHERE LOWER(c.code) = LOWER(sc.value->>'code'))
ON CONFLICT (code) DO NOTHING;

DROP POLICY IF EXISTS "certificates_select_public" ON public.certificates;
DROP POLICY IF EXISTS "certificates_insert_owner_or_admin" ON public.certificates;
DROP POLICY IF EXISTS "certificates_select_owner_or_admin" ON public.certificates;
DROP POLICY IF EXISTS "certificates_insert_admin" ON public.certificates;

CREATE POLICY "certificates_select_owner_or_admin" ON public.certificates
  FOR SELECT USING (auth.uid() = student_id OR public.is_admin());
CREATE POLICY "certificates_insert_admin" ON public.certificates
  FOR INSERT WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS certificates_code_lower_idx ON public.certificates (LOWER(code));

-- Validación pública por código: devuelve solo los datos necesarios y la cédula enmascarada
CREATE OR REPLACE FUNCTION public.validate_certificate(p_code TEXT)
RETURNS TABLE (
  code TEXT,
  student_name TEXT,
  document_hint TEXT,
  course_slug TEXT,
  course_title TEXT,
  hours INT,
  status TEXT,
  issue_date TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.code,
    c.student_name,
    CASE
      WHEN LENGTH(REGEXP_REPLACE(COALESCE(c.document_id, ''), '[^0-9A-Za-z]', '', 'g')) >= 4
        THEN '****' || RIGHT(REGEXP_REPLACE(c.document_id, '[^0-9A-Za-z]', '', 'g'), 4)
      ELSE NULL
    END,
    c.course_slug,
    c.course_title,
    c.hours,
    c.status,
    c.issue_date
  FROM public.certificates c
  WHERE LENGTH(TRIM(COALESCE(p_code, ''))) BETWEEN 6 AND 64
    AND LOWER(c.code) = LOWER(TRIM(p_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_certificate(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_certificate(TEXT) TO anon, authenticated, service_role;

-- Con un certificado emitido, el nombre y la cédula del perfil solo los cambia un administrador
-- (evita editar el perfil con los datos de un tercero para certificarlo a su nombre).
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'student';
  ELSIF NEW.role IS DISTINCT FROM OLD.role OR NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar el rol o el correo de una cuenta'
      USING ERRCODE = '42501';
  ELSIF (NEW.full_name IS DISTINCT FROM OLD.full_name OR NEW.document_id IS DISTINCT FROM OLD.document_id)
    AND EXISTS (SELECT 1 FROM public.certificates c WHERE c.student_id = OLD.id) THEN
    RAISE EXCEPTION 'Tu nombre y documento ya figuran en un certificado emitido; solicita el cambio a la administración'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- -------------------------------------------------------
-- 4. Resultados de evaluación: los registra solo el servidor al calificar; el estudiante los consulta.
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Exam results can be viewed and inserted by owner" ON public.exam_results;
DROP POLICY IF EXISTS "exam_results_select_owner" ON public.exam_results;
CREATE POLICY "exam_results_select_owner" ON public.exam_results
  FOR SELECT USING (auth.uid() = student_id);

COMMIT;
