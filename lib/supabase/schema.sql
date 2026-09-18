-- =======================================================
-- Esquema de Base de Datos para EDDIP (Estudiante & Admin)
-- Ejecutar en el SQL Editor del dashboard de Supabase
-- =======================================================

-- 1. Perfiles de usuario vinculados a auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  document_id TEXT,
  phone TEXT,
  city TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Cursos inscritos por estudiante
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMPTZ,
  progress_percent INT DEFAULT 0,
  UNIQUE(student_id, course_slug)
);

-- 3. Progreso de lecciones individuales
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, course_slug, lesson_id)
);

-- 4. Notas privadas de estudio por lección
CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  note_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, course_slug, lesson_id)
);

-- 5. Resultados de evaluaciones finales
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  certificate_code TEXT,
  submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Certificados emitidos
CREATE TABLE IF NOT EXISTS public.certificates (
  code TEXT PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  hours INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Válido' CHECK (status IN ('Válido', 'Revocado')),
  issue_date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =======================================================
-- Habilitar Row Level Security (RLS)
-- =======================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Políticas de perfiles: el usuario puede ver y editar su propio perfil
CREATE POLICY "Profiles can be viewed by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles can be updated by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles can be inserted on signup" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de inscripciones
CREATE POLICY "Enrollments can be managed by owner" ON public.enrollments FOR ALL USING (auth.uid() = student_id);

-- Políticas de lecciones y notas
CREATE POLICY "Lesson progress can be managed by owner" ON public.lesson_progress FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Student notes can be managed by owner" ON public.student_notes FOR ALL USING (auth.uid() = student_id);

-- Políticas de exámenes
CREATE POLICY "Exam results can be viewed and inserted by owner" ON public.exam_results FOR ALL USING (auth.uid() = student_id);

-- Certificados: lectura pública (para validación) e inserción por el estudiante
CREATE POLICY "Certificates are publicly viewable" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Certificates can be inserted by student" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = student_id);

-- =======================================================
-- Trigger para crear perfil automáticamente al registrarse
-- =======================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, document_id, phone, city, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'document_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =======================================================
-- 7. Catálogo Oficial de Cursos (courses)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  price INT NOT NULL DEFAULT 0,
  duration_hours INT NOT NULL DEFAULT 40,
  level TEXT NOT NULL DEFAULT 'Intermedio',
  rating NUMERIC(3,1) DEFAULT 4.9,
  students INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  gradient TEXT NOT NULL DEFAULT 'linear-gradient(135deg,#0b62dd,#063f9b)',
  instructor JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are publicly viewable" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Courses can be inserted/updated by authenticated users" ON public.courses FOR ALL USING (true);

-- Inserción de cursos oficiales
INSERT INTO public.courses (id, slug, title, category, short_description, description, price, duration_hours, level, rating, students, featured, gradient, instructor, outcomes, modules)
VALUES ('course-001', 'fundamentos-seguridad-convivencia', 'Fundamentos de Seguridad y Convivencia Ciudadana', 'Seguridad y Policía', 'Formación integral en protocolos preventivos, normatividad ciudadana y resolución pacífica de conflictos.', 'Curso especializado orientado a miembros de la fuerza pública, vigilancia y servidores que buscan dominar los lineamientos de convivencia y seguridad ciudadana.', 59900, 20, 'Básico', 4.9, 342, true, 'linear-gradient(135deg,#074ca6 0%,#0e79ee 55%,#54adff 100%)', '{"name":"Equipo Académico EDDIP","role":"Seguridad y Convivencia Ciudadana","bio":"Expertos en táctica preventiva, normatividad policial y gestión de la seguridad en entornos urbanos."}'::jsonb, '["Comprender la estructura legal del código nacional de convivencia.","Aplicar protocolos de mediación y resolución temprana de conflictos.","Manejar procedimientos con estricto apego a los derechos humanos."]'::jsonb, '[{"id":"fsc-m1","title":"Marco General de Convivencia y Seguridad","lessons":[{"id":"fsc-l1","title":"Principios rectores de la seguridad ciudadana","minutes":15,"content":["La convivencia armónica se fundamenta en el respeto recíproco y la articulación eficaz entre ciudadanía y autoridades.","En esta lección exploramos los criterios prioritarios para la prevención del delito y preservación del orden público."],"keyPoint":"La prevención y la mediación son los pilares de la seguridad ciudadana moderna."}]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_hours = EXCLUDED.duration_hours,
  updated_at = NOW();

INSERT INTO public.courses (id, slug, title, category, short_description, description, price, duration_hours, level, rating, students, featured, gradient, instructor, outcomes, modules)
VALUES ('course-002', 'derecho-administrativo-contemporaneo', 'Derecho Administrativo Contemporáneo', 'Área Jurídica', 'Actualización jurídica rigurosa sobre el acto administrativo, procedimiento sancionatorio y jurisprudencia.', 'Programa analítico para abogados y funcionarios sobre las transformaciones recientes del derecho público y la responsabilidad del Estado.', 89900, 30, 'Intermedio', 4.9, 286, true, 'linear-gradient(135deg,#163f91 0%,#1a64df 55%,#68b9ff 100%)', '{"name":"Equipo Académico EDDIP","role":"Derecho Público y Administrativo","bio":"Juristas y docentes especializados en litigio contencioso y control estatal."}'::jsonb, '["Estructurar actos administrativos con validez y motivación plena.","Interpretar líneas jurisprudenciales contemporáneas del Consejo de Estado.","Identificar causales de nulidad y mecanismos de defensa procesal."]'::jsonb, '[{"id":"dac-m1","title":"Teoría del Acto y la Decisión Administrativa","lessons":[{"id":"dac-l1","title":"Eficacia y motivación de la decisión estatal","minutes":20,"content":["El acto administrativo debe contar con motivación fáctica y jurídica congruente para evitar vicios de legalidad.","Estudiaremos los elementos de validez y las tendencias judiciales recientes."],"keyPoint":"La motivación exhaustiva es la principal salvaguarda de legalidad del acto estatal."}]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_hours = EXCLUDED.duration_hours,
  updated_at = NOW();

INSERT INTO public.courses (id, slug, title, category, short_description, description, price, duration_hours, level, rating, students, featured, gradient, instructor, outcomes, modules)
VALUES ('course-003', 'contratacion-estatal-normatividad', 'Contratación Estatal y Normatividad', 'Gestión Pública', 'Criterios técnicos y normativos para licitaciones, pliegos de condiciones y supervisión contractual.', 'Capacitación práctica en el estatuto general de contratación, modalidades de selección, gestión del riesgo y supervisión contractual.', 99900, 25, 'Avanzado', 4.8, 310, true, 'linear-gradient(135deg,#0a4498 0%,#0f68e0 55%,#48a7ff 100%)', '{"name":"Equipo Académico EDDIP","role":"Contratación Pública y Compras Estatales","bio":"Especialistas en estructuración de procesos licitatorios y plataformas transaccionales SECOP."}'::jsonb, '["Elaborar estudios previos y matrices de asignación de riesgos contractuales.","Supervisar la ejecución y liquidación de contratos sin incurrir en faltas disciplinarias.","Dominar las causales de contratación directa y selección abreviada."]'::jsonb, '[{"id":"cen-m1","title":"Planeación y Modalidades de Selección","lessons":[{"id":"cen-l1","title":"Estudios previos y pliegos tipo","minutes":18,"content":["Una contratación exitosa depende del 90% de su rigor en la fase precontractual y análisis del sector.","Revisamos los estándares de transparencia y pliegos tipo obligatorios."],"keyPoint":"La planeación técnica y económica es el blindaje fundamental frente a litigios."}]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_hours = EXCLUDED.duration_hours,
  updated_at = NOW();

INSERT INTO public.courses (id, slug, title, category, short_description, description, price, duration_hours, level, rating, students, featured, gradient, instructor, outcomes, modules)
VALUES ('course-004', 'gestion-publica-resultados', 'Gestión Pública por Resultados', 'Gestión Pública', 'Metodologías de planeación estratégica, presupuesto público e indicadores de impacto ciudadano.', 'Herramientas de vanguardia para transformar la eficiencia estatal mediante metas cuantitativas, optimización de gasto e innovación pública.', 79900, 20, 'Intermedio', 4.8, 245, true, 'linear-gradient(135deg,#0d4b9b 0%,#1469e3 55%,#68b9ff 100%)', '{"name":"Equipo Académico EDDIP","role":"Políticas Públicas y Gerencia Estatal","bio":"Consultores y académicos enfocados en modernización y rendición de cuentas en entidades de gobierno."}'::jsonb, '["Diseñar indicadores de gestión clave (KPIs) con enfoque de valor público.","Articular planes de desarrollo con asignaciones presupuestales plurianuales.","Monitorear la entrega de bienes y servicios a la comunidad con calidad."]'::jsonb, '[{"id":"gpr-m1","title":"Ciclo de Valor y Métricas de Gestión","lessons":[{"id":"gpr-l1","title":"Del insumo al impacto ciudadano","minutes":16,"content":["El modelo por resultados trasciende el simple cumplimiento presupuestal hacia la generación de impacto tangible.","Enfoque en tableros de control y evaluación continua de programas."],"keyPoint":"La eficacia gubernamental se mide por el bienestar creado en la ciudadanía."}]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_hours = EXCLUDED.duration_hours,
  updated_at = NOW();

INSERT INTO public.courses (id, slug, title, category, short_description, description, price, duration_hours, level, rating, students, featured, gradient, instructor, outcomes, modules)
VALUES ('course-005', 'liderazgo-trabajo-equipo', 'Liderazgo y Trabajo en Equipo', 'Desarrollo Profesional', 'Habilidades directivas, comunicación asertiva, resolución de conflictos y alta cohesión grupal.', 'Entrenamiento dinámico diseñado para potenciar el talento de coordinadores, jefes de área y equipos que buscan alto rendimiento.', 49900, 15, 'Básico', 4.9, 412, true, 'linear-gradient(135deg,#124fa8 0%,#1970ea 55%,#78c2ff 100%)', '{"name":"Equipo Académico EDDIP","role":"Desarrollo del Talento y Liderazgo","bio":"Especialistas en coaching organizacional y dinamización de equipos multidisciplinarios."}'::jsonb, '["Ejercer liderazgo adaptativo según los perfiles de cada colaborador.","Fomentar una cultura de retroalimentación constructiva y confianza mutua.","Resolver diferencias interpersonales antes de que afecten la productividad."]'::jsonb, '[{"id":"lte-m1","title":"Comunicación Asertiva y Motivación","lessons":[{"id":"lte-l1","title":"Pilares de un equipo de alto rendimiento","minutes":14,"content":["Un liderazgo inspirador alinea el propósito colectivo y brinda seguridad psicológica para innovar.","Técnicas de delegación efectiva y reconocimiento oportuno."],"keyPoint":"La sinergia y la confianza compartida multiplican los resultados individuales."}]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_hours = EXCLUDED.duration_hours,
  updated_at = NOW();

INSERT INTO public.courses (id, slug, title, category, short_description, description, price, duration_hours, level, rating, students, featured, gradient, instructor, outcomes, modules)
VALUES ('course-006', 'ciberseguridad-entornos-publicos', 'Ciberseguridad para Entornos Públicos', 'Seguridad y Policía', 'Blindaje de infraestructuras críticas, gestión de incidentes digitales y cultura de protección de datos.', 'Especialización técnica y preventiva sobre protección ante ransomware, phishing, custodia de información confidencial y normatividad digital.', 109900, 30, 'Avanzado', 5, 189, true, 'linear-gradient(135deg,#052e69 0%,#0c49a3 55%,#0095ff 100%)', '{"name":"Equipo Académico EDDIP","role":"Seguridad Informática y Ciberdefensa","bio":"Peritos en informática forense, auditoría de vulnerabilidades y centros de respuesta a incidentes (CSIRT)."}'::jsonb, '["Identificar vectores de ataque sofisticados dirigidos a sistemas gubernamentales.","Implementar protocolos de respaldo inmutable y continuidad operativa.","Garantizar el cumplimiento de leyes de habeas data y ciberdefensa nacional."]'::jsonb, '[{"id":"cep-m1","title":"Amenazas Digitales y Resiliencia Institucional","lessons":[{"id":"cep-l1","title":"Topología de amenazas y mitigación temprana","minutes":22,"content":["La ciberseguridad ya no es solo un asunto de TI, sino una cuestión de soberanía y confianza pública.","Estrategias de arquitectura Zero Trust aplicadas a instituciones públicas."],"keyPoint":"La resiliencia digital requiere preparación preventiva antes de cualquier brecha."}]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_hours = EXCLUDED.duration_hours,
  updated_at = NOW();

INSERT INTO public.courses (id, slug, title, category, short_description, description, price, duration_hours, level, rating, students, featured, gradient, instructor, outcomes, modules)
VALUES ('course-007', 'derecho-de-policia', 'Derecho de Policía', 'Área Jurídica', 'Fundamentos legales, principios y herramientas esenciales para comprender la actividad de Policía en Colombia.', 'Curso orientado al fortalecimiento de conocimientos sobre los fundamentos del Derecho de Policía, sus principios, competencias y aplicación práctica en contextos institucionales y ciudadanos.', 45000, 40, 'Intermedio', 4.9, 286, false, 'linear-gradient(135deg,#2050c9 0%,#0e79ee 55%,#68b9ff 100%)', '{"name":"Equipo Académico EDDIP","role":"Formación jurídica y seguridad pública","bio":"Equipo multidisciplinario orientado a formación complementaria en normativa, servicio público y seguridad."}'::jsonb, '["Reconocer principios esenciales del Derecho de Policía.","Relacionar competencias institucionales con situaciones prácticas.","Aplicar criterios básicos de actuación respetando derechos y deberes ciudadanos."]'::jsonb, '[{"id":"dp-m1","title":"Fundamentos del Derecho de Policía","lessons":[{"id":"dp-l1","title":"Concepto y finalidad","minutes":12,"content":["El Derecho de Policía reúne principios, normas y competencias orientadas a mantener las condiciones necesarias para la convivencia. Su estudio exige comprender tanto la función preventiva como los límites de la actuación institucional.","En esta lección revisamos la relación entre convivencia, protección de derechos, deberes ciudadanos y ejercicio legítimo de competencias."],"keyPoint":"La actuación de Policía debe buscar condiciones de convivencia y respetar los límites jurídicos aplicables."}]}]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_hours = EXCLUDED.duration_hours,
  updated_at = NOW();


-- =======================================================
-- 8. Contenido Institucional Dinámico (site_content)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site content is publicly readable" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Site content can be modified by authenticated users" ON public.site_content FOR ALL USING (true);

-- Semillas de contenido institucional
INSERT INTO public.site_content (key, value) VALUES ('aboutHero', '{"eyebrow":"Institución de Educación Superior y Doctrina","title":"Excelencia académica para profesionales de la seguridad y el derecho","description":"La Escuela de Desarrollo y Doctrina Policial (EDDIP) lidera programas de educación continua, doctrina normativa y actualización profesional orientados a servidores públicos, personal de seguridad y juristas en todo el territorio nacional."}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO public.site_content (key, value) VALUES ('mission', '{"title":"Nuestra Misión","description":"Formar y capacitar integralmente a profesionales en seguridad, derecho de policía, derechos humanos y gestión pública mediante programas estructurados bajo los más altos estándares éticos, técnicos y normativos vigentes en Colombia.","pillars":["Rigor doctrinario y fundamentación jurídica","Actualización normativa y jurisprudencial constante","Certificaciones verificables con trazabilidad criptográfica QR","Docentes de amplia trayectoria institucional y académica"]}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO public.site_content (key, value) VALUES ('vision', '{"title":"Nuestra Visión","description":"Ser reconocidos como la plataforma referente a nivel nacional e internacional en formación virtual especializada en convivencia ciudadana, seguridad integral y administración pública, fortaleciendo el ejercicio profesional transparente y efectivo."}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
INSERT INTO public.site_content (key, value) VALUES ('stats', '{"students":"12.500+","courses":"25+","certificates":"8.900+","countries":"15+"}'::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- =======================================================
-- 9. Semillas de Certificados Iniciales Verificables
-- =======================================================
INSERT INTO public.certificates (code, student_name, course_slug, course_title, hours, status, issue_date)
VALUES ('EDDIP-2026-000145', 'Sebastián Martínez', 'derecho-de-policia', 'Derecho de Policía', 40, 'Válido', '15 de agosto de 2026')
ON CONFLICT (code) DO UPDATE SET student_name = EXCLUDED.student_name, status = EXCLUDED.status;
INSERT INTO public.certificates (code, student_name, course_slug, course_title, hours, status, issue_date)
VALUES ('EDDIP-2026-000139', 'Sebastián Martínez', 'derechos-humanos', 'Derechos Humanos', 40, 'Válido', '02 de agosto de 2026')
ON CONFLICT (code) DO UPDATE SET student_name = EXCLUDED.student_name, status = EXCLUDED.status;
INSERT INTO public.certificates (code, student_name, course_slug, course_title, hours, status, issue_date)
VALUES ('EDDIP-2026-000128', 'Laura Gómez', 'gestion-documental', 'Gestión Documental', 40, 'Válido', '23 de julio de 2026')
ON CONFLICT (code) DO UPDATE SET student_name = EXCLUDED.student_name, status = EXCLUDED.status;
INSERT INTO public.certificates (code, student_name, course_slug, course_title, hours, status, issue_date)
VALUES ('EDDIP-2026-000112', 'Carlos Rodríguez', 'seguridad-de-instalaciones', 'Seguridad de Instalaciones', 40, 'Válido', '12 de julio de 2026')
ON CONFLICT (code) DO UPDATE SET student_name = EXCLUDED.student_name, status = EXCLUDED.status;
