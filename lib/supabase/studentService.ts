import { supabase } from './client';
import { callApi } from './authedFetch';
import type { ExamAnswers, PublicExam } from '@/lib/exams/examRules';
import type { StudentProfile, CourseEnrollment, StudentNote, IssuedCertificate, ExamSubmission } from './types';

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

// Generador de UUID v4 estándar compatible con PostgreSQL y navegadores
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Traduce los errores de Supabase Auth a mensajes claros para la persona. */
function describeSignInError(message: string): string {
  if (/email not confirmed/i.test(message)) {
    return 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada o recupera tu contraseña.';
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Demasiados intentos. Espera unos minutos e inténtalo nuevamente.';
  }
  return 'Correo o contraseña incorrectos. Si no recuerdas tu contraseña, usa "¿Olvidaste tu contraseña?" para crear una nueva.';
}

export const studentService = {
  // ==========================================
  // AUTENTICACIÓN SUPABASE Y REGISTRO SEGURO
  // ==========================================
  async signUp(params: {
    email: string;
    password: string;
    fullName: string;
    documentId?: string;
    phone?: string;
    city?: string;
  }) {
    const cleanEmail = (params.email || '').trim().toLowerCase();
    const cleanName = (params.fullName || '').trim();

    if (!cleanEmail) {
      return { user: null, session: null, error: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!cleanName) {
      return { user: null, session: null, error: 'Por favor ingresa tu nombre completo.' };
    }
    if (!params.password || params.password.length < 6) {
      return { user: null, session: null, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    // La cuenta se crea en el servidor (Supabase Auth + perfil de estudiante) con validación de duplicados
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: params.password,
          fullName: cleanName,
          documentId: (params.documentId || '').trim(),
          phone: (params.phone || '').trim(),
          city: (params.city || '').trim(),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        return { user: null, session: null, error: data.error || 'No fue posible crear la cuenta. Inténtalo nuevamente.' };
      }
    } catch {
      return { user: null, session: null, error: 'No fue posible conectar con el servidor. Inténtalo de nuevo.' };
    }

    return this.signIn(cleanEmail, params.password);
  },

  async signIn(email: string, pass: string) {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return { user: null, session: null, error: 'Por favor ingresa tu correo electrónico.' };
    }
    if (!pass) {
      return { user: null, session: null, error: 'Por favor ingresa tu contraseña.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
      if (error || !data.user) {
        return { user: null, session: null, error: describeSignInError(error?.message || '') };
      }
      return { user: data.user, session: data.session, error: null };
    } catch {
      return { user: null, session: null, error: 'No fue posible conectar con el servidor. Inténtalo de nuevo.' };
    }
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

    // 2. Actualizar los datos personales del perfil (el rol y el correo solo los cambia un administrador)
    const profileUpdates = Object.fromEntries(
      Object.entries({
        full_name: updates.fullName,
        document_id: updates.documentId,
        phone: updates.phone,
        city: updates.city,
      }).filter(([, value]) => value !== undefined)
    );
    try {
      await supabase
        .from('profiles')
        .update({ ...profileUpdates, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      console.warn('No fue posible actualizar el perfil:', err);
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

  async resetPasswordForEmail(email: string): Promise<{ success: boolean; error: string | null }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Por favor ingresa tu correo electrónico registrado.' };
    }
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return res.ok ? { success: true, error: null } : { success: false, error: data.error || 'No se pudo enviar el correo.' };
    } catch {
      return { success: false, error: 'No fue posible conectar con el servidor. Inténtalo de nuevo.' };
    }
  },

  async validatePasswordResetToken(token: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, validateOnly: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { valid?: boolean };
      return Boolean(data.valid);
    } catch {
      return false;
    }
  },

  async confirmPasswordReset(token: string, password: string): Promise<{ success: boolean; error: string | null; email?: string }> {
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; email?: string };
      if (!res.ok) return { success: false, error: data.error || 'No fue posible actualizar la contraseña.' };
      return { success: true, error: null, email: data.email };
    } catch {
      return { success: false, error: 'No fue posible conectar con el servidor. Inténtalo de nuevo.' };
    }
  },

  /**
   * Pide al servidor confirmar el pago de una orden con Bold y activar la matrícula.
   * `pending` indica que Bold aún no reporta el pago como aprobado.
   */
  async completeCheckout(
    orderId: string
  ): Promise<{ success: boolean; pending: boolean; saleId: string | null; error: string | null }> {
    const res = await callApi<{ success?: boolean; status?: string; saleId?: string }>('/api/checkout/complete', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
    if (res.ok && res.data.success) return { success: true, pending: false, saleId: res.data.saleId || null, error: null };
    return {
      success: false,
      pending: res.data.status === 'pending',
      saleId: null,
      error: res.data.error || 'No fue posible verificar el pago.',
    };
  },

  // ==========================================
  // CURSOS Y PROGRESO DE LECCIONES
  // ==========================================
  async getEnrollments(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_slug')
        .eq('student_id', userId);

      if (!error && data && data.length > 0) {
        return data.map(d => d.course_slug);
      }
    } catch {
      // Fallback
    }

    return getLocalData<string[]>(`enrollments_${userId}`, []);
  },

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
  // EVALUACIONES Y CERTIFICADOS (calificados y emitidos en el servidor)
  // ==========================================
  async getStudentExam(courseSlug: string): Promise<{ exam: PublicExam | null; error: string | null }> {
    const res = await callApi<{ exam?: PublicExam }>(`/api/exams/${encodeURIComponent(courseSlug)}`);
    return res.ok && res.data.exam
      ? { exam: res.data.exam, error: null }
      : { exam: null, error: res.data.error || 'No fue posible cargar la evaluación.' };
  },

  async submitExam(courseSlug: string, answers: ExamAnswers): Promise<{ result: ExamSubmission | null; error: string | null }> {
    const res = await callApi<ExamSubmission>(`/api/exams/${encodeURIComponent(courseSlug)}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return res.ok
      ? { result: res.data, error: null }
      : { result: null, error: res.data.error || 'No fue posible calificar la evaluación. Inténtalo de nuevo.' };
  },

  /**
   * Busca un certificado por código. El titular y la administración lo leen completo (RLS);
   * el público recibe solo los datos de validación con la cédula enmascarada.
   */
  async getCertificateByCode(code: string): Promise<IssuedCertificate | null> {
    const trimmed = (code || '').trim().slice(0, 64);
    if (!trimmed) return null;

    try {
      const pattern = trimmed.replace(/[\\%_]/g, char => `\\${char}`);
      const { data } = await supabase
        .from('certificates')
        .select('code, student_name, document_id, course_slug, course_title, hours, status, issue_date')
        .ilike('code', pattern)
        .limit(1)
        .maybeSingle();
      if (data) {
        return {
          code: data.code,
          studentName: data.student_name,
          documentId: data.document_id || undefined,
          courseSlug: data.course_slug,
          courseTitle: data.course_title,
          hours: Number(data.hours) || 40,
          status: data.status || 'Válido',
          issueDate: data.issue_date,
        };
      }
    } catch {
      // Sin sesión o sin permisos: se usa la validación pública
    }

    try {
      const { data, error } = await supabase.rpc('validate_certificate', { p_code: trimmed });
      const row = Array.isArray(data) ? data[0] : null;
      if (!error && row) {
        return {
          code: row.code,
          studentName: row.student_name,
          documentHint: row.document_hint || undefined,
          courseSlug: row.course_slug,
          courseTitle: row.course_title,
          hours: Number(row.hours) || 40,
          status: row.status || 'Válido',
          issueDate: row.issue_date,
        };
      }
    } catch {
      // Error de red: se informa como no encontrado
    }

    return null;
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
          documentId: d.document_id || d.documentId,
          courseSlug: d.course_slug,
          courseTitle: d.course_title,
          hours: Number(d.hours) || 40,
          status: d.status || 'Válido',
          issueDate: d.issue_date,
        }));
      }
    } catch {
      // Fallback
    }

    return getLocalData<IssuedCertificate[]>('certificates_list', []);
  },
};
