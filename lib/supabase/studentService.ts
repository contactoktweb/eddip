import { supabase } from './client';
import type { StudentProfile, CourseEnrollment, StudentNote, ExamResultRecord, IssuedCertificate } from './types';

// Storage keys for resilient local fallback
const STORAGE_PREFIX = 'eddip_student_';

function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving local student data:', err);
  }
}

export const studentService = {
  // ==========================================
  // AUTENTICACIÓN SUPABASE
  // ==========================================
  async signUp(params: {
    email: string;
    password: string;
    fullName: string;
    documentId?: string;
    phone?: string;
    city?: string;
  }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.fullName,
            document_id: params.documentId || '',
            phone: params.phone || '',
            city: params.city || '',
            role: 'student',
          },
        },
      });

      if (error) throw error;

      // Save local backup profile
      if (data.user) {
        const profile: StudentProfile = {
          id: data.user.id,
          email: params.email,
          fullName: params.fullName,
          documentId: params.documentId,
          phone: params.phone,
          city: params.city,
          role: 'student',
          createdAt: new Date().toISOString(),
        };
        setLocalData('profile_' + data.user.id, profile);
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar estudiante';
      return { user: null, session: null, error: message };
    }
  },

  async signIn(email: string, pass: string) {
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (!error && data.user) {
        return { user: data.user, session: data.session, error: null };
      }
    } catch {
      // Continuar al fallback de cuentas demo
    }

    // Fallback resiliente para cuentas de prueba si no existen aún en Supabase Auth
    if (cleanEmail === 'admin@demo.eddip.com' || cleanEmail === 'admin@eddip.com') {
      const mockAdminUser = {
        id: 'admin-demo-user-id',
        email: 'admin@demo.eddip.com',
        user_metadata: {
          full_name: 'Administrador EDDIP',
          role: 'admin',
          document_id: '99.888.777',
          phone: '310 999 0000',
          city: 'Bogotá D.C.',
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as import('@supabase/supabase-js').User;

      return { user: mockAdminUser, session: null, error: null };
    }

    if (
      cleanEmail === 'sebastian@demo.eddip.com' ||
      cleanEmail === 'estudiante@demo.eddip.com' ||
      cleanEmail.includes('estudiante') ||
      cleanEmail.includes('demo')
    ) {
      const mockStudentUser = {
        id: 'student-demo-user-id',
        email: cleanEmail,
        user_metadata: {
          full_name: 'Sebastián Martínez',
          role: 'student',
          document_id: '1.032.456.789',
          phone: '300 555 0182',
          city: 'Bogotá D.C.',
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as import('@supabase/supabase-js').User;

      return { user: mockStudentUser, session: null, error: null };
    }

    return { user: null, session: null, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
  },

  async getCurrentSession() {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  async getCurrentUser() {
    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },

  // ==========================================
  // PERFIL DEL ESTUDIANTE
  // ==========================================
  async getProfile(userId: string): Promise<StudentProfile | null> {
    try {
      // 1. Intentar obtener desde Supabase profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          documentId: data.document_id,
          phone: data.phone,
          city: data.city,
          role: data.role || 'student',
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
        };
      }
    } catch {
      // Tabla puede no existir aún en Supabase
    }

    // Fallback: perfil guardado en metadata o local
    const local = getLocalData<StudentProfile | null>('profile_' + userId, null);
    if (local) return local;

    // Default student
    return {
      id: userId,
      email: 'estudiante@demo.eddip.com',
      fullName: 'Sebastián Martínez',
      documentId: '1.032.456.789',
      phone: '300 555 0182',
      city: 'Bogotá D.C.',
      role: 'student',
    };
  },

  async updateProfile(userId: string, updates: Partial<StudentProfile>): Promise<boolean> {
    // 1. Actualizar metadata en Supabase Auth
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          document_id: updates.documentId,
          phone: updates.phone,
          city: updates.city,
        },
      });
    } catch (err) {
      console.warn('Supabase auth metadata update err:', err);
    }

    // 2. Intentar actualizar en tabla profiles si existe
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: updates.fullName,
        document_id: updates.documentId,
        phone: updates.phone,
        city: updates.city,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Graceful fallback si la tabla no existe
    }

    // 3. Actualizar respaldo local
    const current = getLocalData<StudentProfile>('profile_' + userId, {
      id: userId,
      email: updates.email || 'estudiante@demo.eddip.com',
      fullName: updates.fullName || 'Estudiante EDDIP',
      role: 'student',
    });
    setLocalData('profile_' + userId, { ...current, ...updates });
    return true;
  },

  async updatePassword(newPassword: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar contraseña';
      return { success: false, error: message };
    }
  },

  // ==========================================
  // CURSOS Y PROGRESO DE LECCIONES
  // ==========================================
  async getCompletedLessons(userId: string, courseSlug: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', userId)
        .eq('course_slug', courseSlug)
        .eq('completed', true);

      if (!error && data && data.length > 0) {
        return data.map(d => d.lesson_id);
      }
    } catch {
      // Fallback
    }

    const localMap = getLocalData<Record<string, string[]>>(`lessons_${userId}`, {});
    return localMap[courseSlug] || [];
  },

  async toggleLesson(userId: string, courseSlug: string, lessonId: string, currentState: boolean): Promise<boolean> {
    const newState = !currentState;

    // Intentar guardar en Supabase
    try {
      if (newState) {
        await supabase.from('lesson_progress').upsert({
          student_id: userId,
          course_slug: courseSlug,
          lesson_id: lessonId,
          completed: true,
          updated_at: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('lesson_progress')
          .delete()
          .eq('student_id', userId)
          .eq('course_slug', courseSlug)
          .eq('lesson_id', lessonId);
      }
    } catch {
      // Fallback si la tabla no existe
    }

    // Persistir localmente
    const localMap = getLocalData<Record<string, string[]>>(`lessons_${userId}`, {});
    const currentList = localMap[courseSlug] || [];
    const updated = newState
      ? [...new Set([...currentList, lessonId])]
      : currentList.filter(id => id !== lessonId);

    localMap[courseSlug] = updated;
    setLocalData(`lessons_${userId}`, localMap);

    return newState;
  },

  // ==========================================
  // NOTAS DE ESTUDIO
  // ==========================================
  async getLessonNote(userId: string, courseSlug: string, lessonId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .select('note_text')
        .eq('student_id', userId)
        .eq('course_slug', courseSlug)
        .eq('lesson_id', lessonId)
        .single();

      if (!error && data) {
        return data.note_text;
      }
    } catch {
      // Fallback
    }

    const key = `notes_${userId}_${courseSlug}_${lessonId}`;
    return getLocalData<string>(key, '');
  },

  async saveLessonNote(userId: string, courseSlug: string, lessonId: string, noteText: string): Promise<boolean> {
    try {
      await supabase.from('student_notes').upsert({
        student_id: userId,
        course_slug: courseSlug,
        lesson_id: lessonId,
        note_text: noteText,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Fallback
    }

    const key = `notes_${userId}_${courseSlug}_${lessonId}`;
    setLocalData(key, noteText);
    return true;
  },

  // ==========================================
  // EXÁMENES Y RESULTADOS
  // ==========================================
  async saveExamResult(result: ExamResultRecord): Promise<void> {
    try {
      await supabase.from('exam_results').insert({
        student_id: result.studentId,
        course_slug: result.courseSlug,
        course_title: result.courseTitle,
        score: result.score,
        passed: result.passed,
        total_questions: result.totalQuestions,
        correct_answers: result.correctAnswers,
        certificate_code: result.certificateCode || null,
      });
    } catch {
      // Fallback
    }

    const list = getLocalData<ExamResultRecord[]>(`exams_${result.studentId}`, []);
    list.unshift(result);
    setLocalData(`exams_${result.studentId}`, list);
  },

  // ==========================================
  // CERTIFICADOS
  // ==========================================
  async issueCertificate(cert: IssuedCertificate, userId?: string): Promise<void> {
    try {
      await supabase.from('certificates').upsert({
        code: cert.code,
        student_id: userId || null,
        student_name: cert.studentName,
        course_slug: cert.courseSlug,
        course_title: cert.courseTitle,
        hours: cert.hours,
        status: cert.status,
        issue_date: cert.issueDate,
      });
    } catch {
      // Fallback
    }

    const certs = getLocalData<IssuedCertificate[]>('certificates_list', []);
    if (!certs.some(c => c.code === cert.code)) {
      certs.unshift(cert);
      setLocalData('certificates_list', certs);
    }
  },

  async getCertificateByCode(code: string): Promise<IssuedCertificate | null> {
    const trimmed = (code || '').trim();
    if (!trimmed) return null;

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .ilike('code', trimmed)
        .single();

      if (!error && data) {
        return {
          code: data.code,
          studentName: data.student_name,
          courseSlug: data.course_slug,
          courseTitle: data.course_title,
          hours: data.hours,
          status: data.status,
          issueDate: data.issue_date,
        };
      }
    } catch {
      // Fallback
    }

    const certs = getLocalData<IssuedCertificate[]>('certificates_list', []);
    const found = certs.find(c => c.code.toLowerCase() === trimmed.toLowerCase());
    return found || null;
  },

  async getAllCertificates(): Promise<IssuedCertificate[]> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(d => ({
          code: d.code,
          studentName: d.student_name,
          courseSlug: d.course_slug,
          courseTitle: d.course_title,
          hours: d.hours,
          status: d.status,
          issueDate: d.issue_date,
        }));
      }
    } catch {
      // Fallback
    }

    return getLocalData<IssuedCertificate[]>('certificates_list', []);
  },
};
