-- =======================================================
-- EDDIP · Migración de seguridad: Supabase Auth como único almacén de credenciales,
-- rol persistido en public.profiles y políticas RLS por rol.
--
-- Ejecutar completo en el SQL Editor de Supabase (es idempotente), después de completar en la
-- sección 9 los correos de las cuentas administradoras y de diseño legítimas.
-- Después de ejecutarlo, correr `node --env-file=.env.local scripts/migrate-legacy-accounts.mjs`
-- para crear en Supabase Auth las cuentas que solo existían en site_content.
-- =======================================================

BEGIN;

-- -------------------------------------------------------
-- 1. Funciones de rol (SECURITY DEFINER para evitar recursión en las políticas de profiles)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'guest');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() IN ('admin', 'designer');
$$;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon, authenticated, service_role;

-- -------------------------------------------------------
-- 2. Perfiles: el rol y el correo solo los cambia un administrador o el servidor
-- -------------------------------------------------------
-- El registro público nunca puede elegir su rol: toda cuenta nueva nace como estudiante
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, document_id, phone, city, role)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'document_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    'student'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Las peticiones con JWT de usuario (anon/authenticated) no pueden escalar privilegios.
-- El SQL Editor, el trigger de Auth y la service role no tienen esas claims y quedan exentos.
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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles can be viewed by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be inserted on signup" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_owner_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_owner_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_owner_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

CREATE POLICY "profiles_select_owner_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert_owner_or_admin" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update_owner_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- -------------------------------------------------------
-- 3. site_content: lectura pública solo de contenido público; escritura por rol
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
    'notification_log'
  );
$$;

-- Claves que el diseñador instruccional puede mantener junto con los cursos
CREATE OR REPLACE FUNCTION public.is_course_site_content_key(content_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT starts_with(content_key, 'course_images_')
      OR starts_with(content_key, 'exam_')
      OR content_key IN ('admin_exams_list', 'courseCategories');
$$;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Site content is publicly readable" ON public.site_content;
DROP POLICY IF EXISTS "Site content can be modified by authenticated users" ON public.site_content;
DROP POLICY IF EXISTS "site_content_select_public_or_admin" ON public.site_content;
DROP POLICY IF EXISTS "site_content_insert_by_role" ON public.site_content;
DROP POLICY IF EXISTS "site_content_update_by_role" ON public.site_content;
DROP POLICY IF EXISTS "site_content_delete_by_role" ON public.site_content;

CREATE POLICY "site_content_select_public_or_admin" ON public.site_content
  FOR SELECT USING (NOT public.is_private_site_content_key(key) OR public.is_admin());
CREATE POLICY "site_content_insert_by_role" ON public.site_content
  FOR INSERT WITH CHECK (public.is_admin() OR (public.is_staff() AND public.is_course_site_content_key(key)));
CREATE POLICY "site_content_update_by_role" ON public.site_content
  FOR UPDATE USING (public.is_admin() OR (public.is_staff() AND public.is_course_site_content_key(key)))
  WITH CHECK (public.is_admin() OR (public.is_staff() AND public.is_course_site_content_key(key)));
CREATE POLICY "site_content_delete_by_role" ON public.site_content
  FOR DELETE USING (public.is_admin() OR (public.is_staff() AND public.is_course_site_content_key(key)));

-- -------------------------------------------------------
-- 4. Cursos: catálogo público; crear/editar personal académico; eliminar solo administradores
-- -------------------------------------------------------
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Courses are publicly viewable" ON public.courses;
DROP POLICY IF EXISTS "Courses can be inserted/updated by authenticated users" ON public.courses;
DROP POLICY IF EXISTS "courses_select_public" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_staff" ON public.courses;
DROP POLICY IF EXISTS "courses_update_staff" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_admin" ON public.courses;

CREATE POLICY "courses_select_public" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_insert_staff" ON public.courses FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "courses_update_staff" ON public.courses
  FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "courses_delete_admin" ON public.courses FOR DELETE USING (public.is_admin());

-- -------------------------------------------------------
-- 5. Certificados: validación pública; emisión por el propio estudiante o un administrador
-- -------------------------------------------------------
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS document_id TEXT;

-- Conserva la cédula de los certificados que solo la tenían en site_content
UPDATE public.certificates c
SET document_id = sc.value->>'documentId'
FROM public.site_content sc
WHERE sc.key = 'certificate_' || LOWER(c.code)
  AND c.document_id IS NULL
  AND COALESCE(sc.value->>'documentId', '') <> '';

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Certificates are publicly viewable" ON public.certificates;
DROP POLICY IF EXISTS "Certificates can be inserted by student" ON public.certificates;
DROP POLICY IF EXISTS "certificates_select_public" ON public.certificates;
DROP POLICY IF EXISTS "certificates_insert_owner_or_admin" ON public.certificates;
DROP POLICY IF EXISTS "certificates_update_admin" ON public.certificates;
DROP POLICY IF EXISTS "certificates_delete_admin" ON public.certificates;

CREATE POLICY "certificates_select_public" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "certificates_insert_owner_or_admin" ON public.certificates
  FOR INSERT WITH CHECK (public.is_admin() OR (auth.uid() = student_id AND status = 'Válido'));
CREATE POLICY "certificates_update_admin" ON public.certificates
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "certificates_delete_admin" ON public.certificates FOR DELETE USING (public.is_admin());

-- -------------------------------------------------------
-- 6. Datos académicos del estudiante: dueño + gestión administrativa.
--    Las matrículas solo las registra el servidor o un administrador (el estudiante solo las consulta).
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Enrollments can be managed by owner" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_select_owner" ON public.enrollments;
CREATE POLICY "enrollments_select_owner" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "enrollments_admin_all" ON public.enrollments;
DROP POLICY IF EXISTS "lesson_progress_select_admin" ON public.lesson_progress;
DROP POLICY IF EXISTS "exam_results_select_admin" ON public.exam_results;
CREATE POLICY "enrollments_admin_all" ON public.enrollments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "lesson_progress_select_admin" ON public.lesson_progress FOR SELECT USING (public.is_admin());
CREATE POLICY "exam_results_select_admin" ON public.exam_results FOR SELECT USING (public.is_admin());

-- -------------------------------------------------------
-- 7. Purga de contraseñas en texto plano del registro heredado
--    (las cuentas se migran a Supabase Auth con scripts/migrate-legacy-accounts.mjs)
-- -------------------------------------------------------
UPDATE public.site_content
SET value = COALESCE(
      (
        SELECT jsonb_agg(CASE WHEN jsonb_typeof(account) = 'object' THEN account - 'password' ELSE account END)
        FROM jsonb_array_elements(value) AS account
      ),
      '[]'::jsonb
    ),
    updated_at = NOW()
WHERE key = 'eddip_registered_users'
  AND jsonb_typeof(value) = 'array';

-- -------------------------------------------------------
-- 8. Storage para multimedia de lecciones (reemplaza imágenes/videos en base64 dentro de courses.modules)
-- -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-media',
  'course-media',
  true,
  104857600,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 9. Restablecimiento de roles: hasta ahora cualquier persona podía asignarse un rol desde el navegador,
--    así que ningún rol previo es confiable. Todos vuelven a estudiante salvo los correos indicados aquí.
--    ANTES DE EJECUTAR: escribe en la lista los correos de las cuentas administradoras y de diseño legítimas.
-- -------------------------------------------------------
DO $$
DECLARE
  trusted_admins TEXT[] := ARRAY[]::TEXT[];    -- ej.: ARRAY['direccion@dominio.com']
  trusted_designers TEXT[] := ARRAY[]::TEXT[]; -- ej.: ARRAY['disenador@dominio.com']
BEGIN
  UPDATE public.profiles SET role = 'student', updated_at = NOW()
  WHERE role <> 'student'
    AND LOWER(email) <> ALL (trusted_admins || trusted_designers);
  UPDATE public.profiles SET role = 'admin', updated_at = NOW() WHERE LOWER(email) = ANY (trusted_admins);
  UPDATE public.profiles SET role = 'designer', updated_at = NOW() WHERE LOWER(email) = ANY (trusted_designers);
END;
$$;

COMMIT;

-- Verificación: solo estas cuentas tendrán acceso al panel administrativo.
SELECT email, full_name, role FROM public.profiles WHERE role <> 'student' ORDER BY role, email;
