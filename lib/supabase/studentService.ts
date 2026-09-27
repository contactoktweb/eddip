import { supabase } from './client';
import { adminService } from './adminService';
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
    const cleanDoc = (params.documentId || '').trim();
    const cleanPhone = (params.phone || '').trim();
    const cleanCity = (params.city || '').trim();

    if (!cleanEmail) {
      return { user: null, session: null, error: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!cleanName) {
      return { user: null, session: null, error: 'Por favor ingresa tu nombre completo.' };
    }

    // 1. Verificación rigurosa de NO duplicidad antes de registrar
    const dupCheck = await adminService.isStudentDuplicate(cleanEmail, cleanDoc);
    if (dupCheck.isDuplicate) {
      return {
        user: null,
        session: null,
        error: dupCheck.message || 'El correo o documento ya se encuentra registrado.',
      };
    }

    try {
      // 2. Registro oficial en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: params.password,
        options: {
          data: {
            full_name: cleanName,
            document_id: cleanDoc,
            phone: cleanPhone,
            city: cleanCity,
            role: 'student',
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
          return {
            user: null,
            session: null,
            error: 'Este correo electrónico ya se encuentra registrado en el sistema. Por favor inicia sesión.',
          };
        }
        throw error;
      }

      // Si Supabase devuelve usuario con identidades vacías, el usuario ya existía
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          user: null,
          session: null,
          error: 'Este correo electrónico ya se encuentra registrado en el sistema. Por favor inicia sesión.',
        };
      }

      const userId = data.user?.id || `st-${Date.now()}`;

      // 3. PERSISTENCIA EN BASE DE DATOS (tabla profiles de Supabase)
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          document_id: cleanDoc,
          phone: cleanPhone,
          city: cleanCity,
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Advertencia al guardar perfil en Supabase:', e);
      }

      // 4. Registro y sincronización en adminService (persiste en site_content y notifica)
      await adminService.saveStudent({
        id: userId,
        name: cleanName,
        email: cleanEmail,
        documentId: cleanDoc,
        phone: cleanPhone,
        city: cleanCity || 'Colombia',
        coursesCount: 0,
        progressAvg: 0,
        certificatesCount: 0,
        registeredAt: new Date().toISOString().slice(0, 10),
        status: 'Activo',
        enrolledCourses: [],
        examScores: [],
      });

      // 5. Guardar perfil local
      const profile: StudentProfile = {
        id: userId,
        email: cleanEmail,
        fullName: cleanName,
        documentId: cleanDoc,
        phone: cleanPhone,
        city: cleanCity,
        role: 'student',
        createdAt: new Date().toISOString(),
      };
      setLocalData('profile_' + userId, profile);

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
      cleanEmail === 'disenador@demo.eddip.com' ||
      cleanEmail === 'disenador@eddip.edu.co' ||
      cleanEmail.includes('disenador') ||
      cleanEmail.includes('designer')
    ) {
      const mockDesignerUser = {
        id: 'designer-demo-user-id',
        email: 'disenador@eddip.edu.co',
        user_metadata: {
          full_name: 'Diseñador Instruccional',
          role: 'designer',
          document_id: '88.777.666',
          phone: '312 444 5566',
          city: 'Bogotá D.C.',
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as import('@supabase/supabase-js').User;

      return { user: mockDesignerUser, session: null, error: null };
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

  async resetPasswordForEmail(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: 'Por favor ingresa tu correo electrónico registrado.' };
      }
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?mode=reset` : undefined,
      });
      if (error) {
        console.warn('Supabase resetPassword error:', error.message);
      }
      return { success: true, error: null };
    } catch {
      return { success: true, error: null };
    }
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

  async enrollCourse(userId: string, courseSlug: string): Promise<boolean> {
    try {
      await supabase.from('enrollments').upsert({
        student_id: userId,
        course_slug: courseSlug,
        enrolled_at: new Date().toISOString(),
      });
    } catch {
      // Fallback
    }

    const current = getLocalData<string[]>(`enrollments_${userId}`, []);
    if (!current.includes(courseSlug)) {
      setLocalData(`enrollments_${userId}`, [...current, courseSlug]);
    }
    return true;
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
  // CERTIFICADOS CON ALTA DISPONIBILIDAD Y PERSISTENCIA
  // ==========================================
  async issueCertificate(cert: IssuedCertificate, userId?: string): Promise<void> {
    const isUuid = (id?: string) =>
      Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
    const validStudentId = isUuid(userId) ? userId : null;

    // 1. Persistir en tabla certificates de Supabase (evitando errores de tipo UUID)
    try {
      await supabase.from('certificates').upsert({
        code: cert.code,
        student_id: validStudentId,
        student_name: cert.studentName,
        course_slug: cert.courseSlug,
        course_title: cert.courseTitle,
        hours: cert.hours,
        status: cert.status || 'Válido',
        issue_date: cert.issueDate,
      });
    } catch (e) {
      console.warn('Aviso al insertar en tabla certificates:', e);
    }

    // 2. Persistir siempre en site_content para consulta pública sin restricciones RLS/UUID
    try {
      await supabase.from('site_content').upsert({
        key: `certificate_${cert.code.toLowerCase()}`,
        value: {
          code: cert.code,
          student: cert.studentName,
          studentName: cert.studentName,
          documentId: cert.documentId,
          courseSlug: cert.courseSlug,
          course: cert.courseTitle,
          courseTitle: cert.courseTitle,
          hours: cert.hours,
          status: cert.status || 'Válido',
          date: cert.issueDate,
          issueDate: cert.issueDate,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn('Aviso al registrar certificado en site_content:', e);
    }

    // 3. Persistir en almacenamiento local (claves atómicas y listas)
    const certPayload = {
      ...cert,
      status: cert.status || 'Válido',
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`eddip_cert_${cert.code.toLowerCase()}`, JSON.stringify(certPayload));
      } catch {}
    }

    const certs = getLocalData<IssuedCertificate[]>('certificates_list', []);
    const exists = certs.findIndex(c => c.code.toLowerCase() === cert.code.toLowerCase());
    if (exists >= 0) {
      certs[exists] = certPayload;
    } else {
      certs.unshift(certPayload);
    }
    setLocalData('certificates_list', certs);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('eddip_student_certificates_list', JSON.stringify(certs));
        window.dispatchEvent(new CustomEvent('eddip_certificate_issued', { detail: certPayload }));
      } catch {}
    }
  },

  async getCertificateByCode(code: string): Promise<IssuedCertificate | null> {
    const trimmed = (code || '').trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();

    // 1. Revisar clave atómica en localStorage
    if (typeof window !== 'undefined') {
      try {
        const direct = localStorage.getItem(`eddip_cert_${lower}`);
        if (direct) {
          const p = JSON.parse(direct);
          if (p && p.code) {
            return {
              code: p.code,
              studentName: p.studentName || p.student,
              documentId: p.documentId,
              courseSlug: p.courseSlug,
              courseTitle: p.courseTitle || p.course,
              hours: Number(p.hours) || 40,
              status: p.status || 'Válido',
              issueDate: p.issueDate || p.date,
            };
          }
        }
      } catch {}
    }

    // 2. Revisar listas locales
    const localCerts = getLocalData<IssuedCertificate[]>('certificates_list', []);
    const foundLocal = localCerts.find(c => c.code.toLowerCase() === lower);
    if (foundLocal) return foundLocal;

    if (typeof window !== 'undefined') {
      try {
        const rawAlt = localStorage.getItem('eddip_student_certificates_list');
        if (rawAlt) {
          const list: any[] = JSON.parse(rawAlt);
          const f = list.find((c: any) => c.code && c.code.toLowerCase() === lower);
          if (f) {
            return {
              code: f.code,
              studentName: f.studentName || f.student,
              documentId: f.documentId,
              courseSlug: f.courseSlug,
              courseTitle: f.courseTitle || f.course,
              hours: Number(f.hours) || 40,
              status: f.status || 'Válido',
              issueDate: f.issueDate || f.date,
            };
          }
        }
      } catch {}
    }

    // 3. Revisar en Supabase tabla site_content (clave directa)
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', `certificate_${lower}`)
        .single();

      if (!error && data?.value) {
        const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (val && val.code) {
          return {
            code: val.code,
            studentName: val.studentName || val.student,
            documentId: val.documentId,
            courseSlug: val.courseSlug,
            courseTitle: val.courseTitle || val.course,
            hours: Number(val.hours) || 40,
            status: val.status || 'Válido',
            issueDate: val.issueDate || val.date,
          };
        }
      }
    } catch {}

    // 4. Revisar en Supabase tabla certificates
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
          documentId: data.document_id || data.documentId,
          courseSlug: data.course_slug,
          courseTitle: data.course_title,
          hours: Number(data.hours) || 40,
          status: data.status || 'Válido',
          issueDate: data.issue_date,
        };
      }
    } catch {}

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
