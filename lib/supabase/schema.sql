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
