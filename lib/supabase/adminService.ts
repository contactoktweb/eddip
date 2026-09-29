import { supabase } from './client';
import type { Course, Exam, ExamQuestion, Certificate, Sale } from '@/lib/types';
import { baseCourses, certificates, exams as baseExams } from '@/lib/data';
import { getRegisteredAccounts, saveRegisteredAccount, type RegisteredAccount, generateUUID } from './studentService';

const STORAGE_PREFIX = 'eddip_admin_';

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
    console.warn('Error saving admin local data:', err);
  }
}

export type EnrichedStudent = {
  id: string;
  name: string;
  email: string;
  documentId?: string;
  phone?: string;
  city?: string;
  coursesCount: number;
  progressAvg: number;
  certificatesCount: number;
  registeredAt: string;
  status: 'Activo' | 'Inactivo' | 'Completado';
  role?: 'student' | 'admin' | 'designer';
  enrolledCourses: {
    slug: string;
    title: string;
    progress: number;
    completedLessons: string[];
    totalLessons: number;
    certificateCode?: string;
  }[];
  examScores: {
    courseSlug: string;
    courseTitle: string;
    score: number;
    passed: boolean;
    date: string;
  }[];
};

export const adminService = {
  // ==========================================
  // CURSOS Y CONTENIDO
  // ==========================================
  async saveCourse(course: Course): Promise<{ success: boolean; error: string | null }> {
    const primaryImg = course.image || (course.images && course.images[0]) || '';
    const allImgs = course.images && course.images.length > 0 ? course.images : (primaryImg ? [primaryImg] : []);

    const instructorPayload = {
      ...(course.instructor || {}),
      image: primaryImg,
      images: allImgs,
      courseImage: primaryImg,
      courseImages: allImgs,
    };

    // 1. Guardar en tabla courses de Supabase (con compatibilidad de esquema)
    try {
      const fullPayload = {
        id: course.id,
        slug: course.slug,
        title: course.title,
        category: course.category,
        short_description: course.shortDescription,
        description: course.description,
        price: course.price,
        duration_hours: course.durationHours,
        level: course.level,
        students: course.students,
        gradient: course.gradient,
        instructor: instructorPayload,
        outcomes: course.outcomes,
        modules: course.modules,
        image: primaryImg,
        images: allImgs,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase.from('courses').upsert(fullPayload);

      // Si la tabla remota no tiene las columnas image o images en el esquema SQL actual,
      // reintentamos asegurando que las imágenes queden persistidas en instructor
      if (upsertErr) {
        await supabase.from('courses').upsert({
          id: course.id,
          slug: course.slug,
          title: course.title,
          category: course.category,
          short_description: course.shortDescription,
          description: course.description,
          price: course.price,
          duration_hours: course.durationHours,
          level: course.level,
          students: course.students,
          gradient: course.gradient,
          instructor: instructorPayload,
          outcomes: course.outcomes,
          modules: course.modules,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Error al guardar en tabla courses:', e);
    }

    // 2. Persistir registro explícito de imágenes en la tabla site_content de Supabase
    try {
      await supabase.from('site_content').upsert({
        key: `course_images_${course.slug}`,
        value: {
          slug: course.slug,
          courseId: course.id,
          image: primaryImg,
          images: allImgs,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn('Error al registrar imágenes en site_content:', e);
    }

    // 3. Respaldo persistente en LocalStorage unificado
    const enrichedCourse: Course = {
      ...course,
      image: primaryImg,
      images: allImgs,
      instructor: instructorPayload,
    };

    const extraCourses = getLocalData<Course[]>('extra_courses', []);
    const existsIndex = extraCourses.findIndex(c => c.slug === course.slug || c.id === course.id);
    if (existsIndex >= 0) {
      extraCourses[existsIndex] = enrichedCourse;
    } else {
      extraCourses.unshift(enrichedCourse);
    }
    setLocalData('extra_courses', extraCourses);
    setLocalData('eddip_admin_extra_courses', extraCourses);

    return { success: true, error: null };
  },

  async deleteCourse(slug: string): Promise<boolean> {
    try {
      await supabase.from('courses').delete().eq('slug', slug);
      await supabase.from('site_content').delete().eq('key', `course_images_${slug}`);
    } catch {
      // Fallback
    }

    const extraCourses = getLocalData<Course[]>('extra_courses', []);
    const filtered = extraCourses.filter(c => c.slug !== slug);
    setLocalData('extra_courses', filtered);
    setLocalData('eddip_admin_extra_courses', filtered);
    return true;
  },

  // ==========================================
  // ESTUDIANTES / DIRECTORIO SINCRONIZADO CON BASE DE DATOS REAL
  // ==========================================
  async getAllStudents(): Promise<EnrichedStudent[]> {
    // 1. Helper para descartar datos mock o semillas heredadas de pruebas de demostración
    const isMockSeed = (s: Partial<EnrichedStudent>) => {
      if (!s || !s.id) return false;
      if (/^st-00\d$/.test(s.id)) return true;
      if (
        s.email &&
        s.email.endsWith('@eddip.edu.co') &&
        ['estudiante', 'laura', 'carlos', 'natalia', 'andres', 'juliana', 'felipe', 'valeria', 'daniel', 'mariana'].includes(
          s.email.split('@')[0]
        )
      ) {
        return true;
      }
      return false;
    };

    // 2. Consultar estudiantes en la base de datos Supabase (tabla site_content clave 'admin_students_list')
    let remoteStudents: EnrichedStudent[] = [];
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', 'admin_students_list')
        .maybeSingle();

      if (!error && data?.value && Array.isArray(data.value)) {
        remoteStudents = (data.value as EnrichedStudent[]).filter(s => !isMockSeed(s));
      }
    } catch (err) {
      console.warn('Advertencia al consultar estudiantes en Supabase site_content:', err);
    }

    // 3. Consultar perfiles registrados en la tabla profiles de Supabase
    let profileStudents: EnrichedStudent[] = [];
    try {
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pError && profiles && Array.isArray(profiles)) {
        profileStudents = profiles
          .filter(p => p.role !== 'admin' && p.email && !p.email.includes('admin') && !isMockSeed(p))
          .map(p => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Estudiante',
            email: p.email,
            documentId: p.document_id || '',
            phone: p.phone || '',
            city: p.city || 'Colombia',
            coursesCount: 0,
            progressAvg: 0,
            certificatesCount: 0,
            registeredAt: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            status: 'Activo' as const,
            role: (p.role as 'student' | 'admin' | 'designer') || 'student',
            enrolledCourses: [],
            examScores: [],
          }));
      }
    } catch {
      // Ignorar si la tabla profiles no permite lectura pública
    }

    // 4. Leer respaldo local en localStorage (limpiando cualquier residuo de mock)
    const rawLocal = getLocalData<EnrichedStudent[]>('custom_students', []);
    const localStudents = rawLocal.filter(s => !isMockSeed(s));
    if (rawLocal.length !== localStudents.length && typeof window !== 'undefined') {
      setLocalData('custom_students', localStudents);
    }

    // 5. MOTOR DE DEDUPLICACIÓN ESTRICTA:
    // Nunca permitir duplicados por correo electrónico ni por número de cédula / documento
    const deduplicatedMap = new Map<string, EnrichedStudent>();
    const docIndex = new Map<string, string>(); // normDoc -> targetKey

    const normalizeEmail = (email?: string) => (email || '').trim().toLowerCase();
    const normalizeDoc = (doc?: string) => (doc || '').replace(/[\s.-]/g, '').trim();

    const insertOrMerge = (s: EnrichedStudent) => {
      if (!s || !s.email) return;
      const nEmail = normalizeEmail(s.email);
      const nDoc = normalizeDoc(s.documentId);

      let targetKey = nEmail;
      if (!targetKey && nDoc) {
        targetKey = docIndex.get(nDoc) || `doc_${nDoc}`;
      } else if (nDoc && docIndex.has(nDoc)) {
        targetKey = docIndex.get(nDoc)!;
      }

      if (deduplicatedMap.has(targetKey)) {
        const existing = deduplicatedMap.get(targetKey)!;
        // Fusionar datos preservando la información más completa y reciente
        if (!existing.name || existing.name === 'Estudiante') existing.name = s.name;
        if (!existing.documentId && s.documentId) existing.documentId = s.documentId;
        if (!existing.phone && s.phone) existing.phone = s.phone;
        if ((!existing.city || existing.city === 'Colombia') && s.city) existing.city = s.city;
        if (s.registeredAt && (!existing.registeredAt || s.registeredAt < existing.registeredAt)) {
          existing.registeredAt = s.registeredAt;
        }

        // Fusionar cursos inscritos sin duplicar slugs
        const currentSlugs = new Set((existing.enrolledCourses || []).map(c => c.slug));
        for (const ec of s.enrolledCourses || []) {
          if (!currentSlugs.has(ec.slug)) {
            existing.enrolledCourses.push(ec);
            currentSlugs.add(ec.slug);
          }
        }
        existing.coursesCount = existing.enrolledCourses.length;
        existing.progressAvg = Math.max(existing.progressAvg || 0, s.progressAvg || 0);
        existing.certificatesCount = Math.max(existing.certificatesCount || 0, s.certificatesCount || 0);

        if (existing.progressAvg >= 100 || s.progressAvg >= 100) {
          existing.status = 'Completado';
        } else if (existing.progressAvg > 0 || s.progressAvg > 0 || existing.coursesCount > 0) {
          existing.status = 'Activo';
        }

        deduplicatedMap.set(targetKey, existing);
      } else {
        const clone = {
          ...s,
          email: nEmail,
          enrolledCourses: [...(s.enrolledCourses || [])],
          examScores: [...(s.examScores || [])],
        };
        deduplicatedMap.set(targetKey, clone);
        if (nDoc) {
          docIndex.set(nDoc, targetKey);
        }
      }
    };

    // Orden de prioridad: datos remotos de Supabase primero, luego perfiles de auth, luego locales reales.
    // NOTA: No insertamos baseList (mock data). El directorio refleja exclusivamente la base de datos real.
    for (const s of remoteStudents) insertOrMerge(s);
    for (const s of profileStudents) insertOrMerge(s);
    for (const s of localStudents) insertOrMerge(s);

    const consolidated = Array.from(deduplicatedMap.values());
    return consolidated;
  },

  // ==========================================
  // VALIDACIÓN DE NO DUPLICIDAD DE ESTUDIANTE
  // ==========================================
  async isStudentDuplicate(
    email: string,
    documentId?: string,
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; field?: 'email' | 'documentId'; message?: string; existingStudent?: EnrichedStudent }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanDoc = (documentId || '').trim();
    const normDoc = cleanDoc.replace(/[\s.-]/g, '');

    // 1. Obtener la lista consolidada
    const allStudents = await this.getAllStudents();

    // 2. Validar duplicidad de correo electrónico
    if (cleanEmail) {
      const byEmail = allStudents.find(
        s => s.email.toLowerCase() === cleanEmail && (!excludeId || s.id !== excludeId)
      );
      if (byEmail) {
        return {
          isDuplicate: true,
          field: 'email',
          message: `El correo electrónico "${cleanEmail}" ya se encuentra registrado en el sistema.`,
          existingStudent: byEmail,
        };
      }

      // Validar también en la base de datos Supabase (tabla profiles)
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .ilike('email', cleanEmail);

        if (profs && profs.length > 0) {
          const match = profs.find(p => !excludeId || p.id !== excludeId);
          if (match) {
            return {
              isDuplicate: true,
              field: 'email',
              message: `El correo electrónico "${cleanEmail}" ya está registrado en la base de datos (${match.full_name}).`,
            };
          }
        }
      } catch {
        // Fallback
      }
    }

    // 3. Validar duplicidad de documento de identidad / cédula
    if (normDoc && normDoc.length >= 4) {
      const byDoc = allStudents.find(s => {
        const sDoc = (s.documentId || '').replace(/[\s.-]/g, '');
        return sDoc === normDoc && (!excludeId || s.id !== excludeId);
      });
      if (byDoc) {
        return {
          isDuplicate: true,
          field: 'documentId',
          message: `El documento de identidad "${cleanDoc}" ya se encuentra registrado con el estudiante ${byDoc.name}.`,
          existingStudent: byDoc,
        };
      }

      // Validar también en la base de datos Supabase (tabla profiles)
      try {
        const { data: profsDoc } = await supabase
          .from('profiles')
          .select('id, full_name, document_id')
          .not('document_id', 'is', null);

        if (profsDoc && profsDoc.length > 0) {
          const match = profsDoc.find(p => {
            const pDoc = (p.document_id || '').replace(/[\s.-]/g, '');
            return pDoc === normDoc && (!excludeId || p.id !== excludeId);
          });
          if (match) {
            return {
              isDuplicate: true,
              field: 'documentId',
              message: `El documento de identidad "${cleanDoc}" ya se encuentra registrado en la base de datos (${match.full_name}).`,
            };
          }
        }
      } catch {
        // Fallback
      }
    }

    return { isDuplicate: false };
  },

  // ==========================================
  // GUARDAR Y PERSISTIR ESTUDIANTE EN BASE DE DATOS
  // ==========================================
  async saveStudent(studentData: Partial<EnrichedStudent> & { name: string; email: string }): Promise<{
    success: boolean;
    error: string | null;
    student?: EnrichedStudent;
  }> {
    const cleanEmail = (studentData.email || '').trim().toLowerCase();
    const cleanDoc = (studentData.documentId || '').trim();
    const cleanName = (studentData.name || '').trim();

    if (!cleanEmail) {
      return { success: false, error: 'El correo electrónico es obligatorio.' };
    }
    if (!cleanName) {
      return { success: false, error: 'El nombre completo es obligatorio.' };
    }

    // 1. Comprobar que no haya duplicados
    const dupCheck = await this.isStudentDuplicate(cleanEmail, cleanDoc, studentData.id);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        error: dupCheck.message || 'Ya existe un estudiante registrado con estos datos.',
      };
    }

    // 2. Obtener lista consolidada actual
    const currentList = await this.getAllStudents();
    const existingIndex = currentList.findIndex(
      s => (studentData.id && s.id === studentData.id) || s.email.toLowerCase() === cleanEmail
    );

    let resolvedStudent: EnrichedStudent;
    if (existingIndex >= 0) {
      resolvedStudent = {
        ...currentList[existingIndex],
        ...studentData,
        name: cleanName,
        email: cleanEmail,
        documentId: cleanDoc || currentList[existingIndex].documentId,
        phone: studentData.phone?.trim() || currentList[existingIndex].phone || '',
        city: studentData.city?.trim() || currentList[existingIndex].city || 'Colombia',
        role: studentData.role || currentList[existingIndex].role || 'student',
      };
      currentList[existingIndex] = resolvedStudent;
    } else {
      resolvedStudent = {
        id: studentData.id || `st-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        documentId: cleanDoc,
        phone: studentData.phone?.trim() || '',
        city: studentData.city?.trim() || 'Colombia',
        coursesCount: studentData.coursesCount || (studentData.enrolledCourses?.length || 0),
        progressAvg: studentData.progressAvg || 0,
        certificatesCount: studentData.certificatesCount || 0,
        registeredAt: studentData.registeredAt || new Date().toISOString().slice(0, 10),
        status: studentData.status || 'Activo',
        role: studentData.role || 'student',
        enrolledCourses: studentData.enrolledCourses || [],
        examScores: studentData.examScores || [],
      };
      currentList.unshift(resolvedStudent);
    }

    // 3. PERSISTENCIA EN SUPABASE:
    // a) En la tabla site_content con clave 'admin_students_list'
    try {
      await supabase.from('site_content').upsert({
        key: 'admin_students_list',
        value: currentList,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Error al guardar en Supabase site_content:', err);
    }

    // b) En la tabla profiles de Supabase
    try {
      await supabase.from('profiles').upsert({
        id: resolvedStudent.id,
        email: cleanEmail,
        full_name: resolvedStudent.name,
        document_id: cleanDoc,
        phone: resolvedStudent.phone || '',
        city: resolvedStudent.city || '',
        role: resolvedStudent.role || 'student',
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Error al guardar en tabla profiles de Supabase:', err);
    }

    // 4. Respaldo local
    setLocalData('custom_students', currentList);
    setLocalData('eddip_admin_custom_students', currentList);

    // 5. Notificación reactiva
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eddip_students_updated', { detail: currentList }));
      try {
        localStorage.setItem('eddip_students_ping', Date.now().toString());
      } catch {}
    }

    return { success: true, error: null, student: resolvedStudent };
  },

  // ==========================================
  // EVALUACIONES
  // ==========================================
  async getExams(): Promise<Exam[]> {
    const examMap = new Map<string, Exam>();

    // 1. Semilla base
    for (const be of baseExams) {
      examMap.set(be.courseSlug, be);
    }

    // 2. Base de datos Supabase (site_content y tabla exams)
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('key, value')
        .like('key', 'exam_%');

      if (!error && data && data.length > 0) {
        for (const row of data) {
          try {
            const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
            if (parsed && parsed.courseSlug && parsed.questions) {
              examMap.set(parsed.courseSlug, parsed);
            }
          } catch {}
        }
      }
    } catch {}

    try {
      const { data, error } = await supabase.from('exams').select('*');
      if (!error && data && data.length > 0) {
        for (const row of data) {
          examMap.set(row.course_slug, {
            courseSlug: row.course_slug,
            title: row.title,
            passingScore: Number(row.passing_score) || 75,
            questions: row.questions || [],
          });
        }
      }
    } catch {}

    // 3. LocalStorage del navegador (prioridad sobre defaults para personalizaciones inmediatas)
    if (typeof window !== 'undefined') {
      try {
        const rawAlt = localStorage.getItem('custom_exams');
        if (rawAlt) {
          const parsed: Exam[] = JSON.parse(rawAlt);
          for (const ex of parsed) {
            if (ex && ex.courseSlug && ex.questions) {
              examMap.set(ex.courseSlug, ex);
            }
          }
        }
      } catch {}
    }

    const localExams = getLocalData<Exam[]>('custom_exams', []);
    for (const ex of localExams) {
      if (ex && ex.courseSlug && ex.questions) {
        examMap.set(ex.courseSlug, ex);
      }
    }

    return Array.from(examMap.values());
  },

  async getExamBySlug(slug: string, course?: Course): Promise<Exam> {
    // 1. Revisar primero clave directa atómica en LocalStorage para reactividad instantánea
    if (typeof window !== 'undefined') {
      try {
        const directKey = localStorage.getItem(`eddip_exam_${slug}`);
        if (directKey) {
          const parsed = JSON.parse(directKey);
          if (parsed && parsed.questions && parsed.questions.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }

    // 2. Revisar en lista de custom_exams en LocalStorage
    const localExams = getLocalData<Exam[]>('custom_exams', []);
    const foundLocal = localExams.find(e => e.courseSlug === slug);
    if (foundLocal && foundLocal.questions && foundLocal.questions.length > 0) {
      return foundLocal;
    }

    if (typeof window !== 'undefined') {
      try {
        const rawAlt = localStorage.getItem('custom_exams');
        if (rawAlt) {
          const parsed: Exam[] = JSON.parse(rawAlt);
          const found = parsed.find(e => e.courseSlug === slug);
          if (found && found.questions && found.questions.length > 0) {
            return found;
          }
        }
      } catch {}
    }

    // 3. Revisar en Supabase site_content (clave individual y lista general)
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', `exam_${slug}`)
        .single();

      if (!error && data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (parsed && parsed.questions && parsed.questions.length > 0) {
          return parsed as Exam;
        }
      }
    } catch {}

    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', 'admin_exams_list')
        .single();

      if (!error && data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        if (Array.isArray(parsed)) {
          const found = parsed.find((e: any) => e.courseSlug === slug);
          if (found && found.questions && found.questions.length > 0) {
            return found as Exam;
          }
        }
      }
    } catch {}

    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('course_slug', slug)
        .single();

      if (!error && data && data.questions && data.questions.length > 0) {
        return {
          courseSlug: data.course_slug,
          title: data.title,
          passingScore: Number(data.passing_score) || 75,
          questions: data.questions,
        };
      }
    } catch {}

    // 3. Revisar en lista estática base
    const baseFound = baseExams.find(e => e.courseSlug === slug);
    if (baseFound && baseFound.questions && baseFound.questions.length > 0) {
      return baseFound;
    }

    // 4. Si no ha sido configurado en administración aún, proveer una estructura doctrinal limpia y personalizable
    const examTitle = course ? `Evaluación de Certificación — ${course.title}` : `Evaluación Final`;
    const defaultQuestions: ExamQuestion[] = course && course.modules && course.modules.length > 0
      ? course.modules.flatMap((m, mIdx) => [
          {
            id: `q_${slug}_${mIdx}_1`,
            text: `En el marco de ${m.title}, ¿cuál es el principio orientador prioritario para la correcta actuación del servidor o profesional?`,
            options: [
              `Garantizar el estricto apego al orden legal, la proporcionalidad y la debida fundamentación`,
              `Proceder sin registro documental ni motivación jurídica`,
              `Omitir el debido proceso en favor de la inmediatez`,
              `Delegar las facultades normativas a particulares sin competencia`,
            ],
            correct: 0,
          },
          {
            id: `q_${slug}_${mIdx}_2`,
            text: `¿Qué garantía institucional asegura la correcta ejecución de los protocolos revisados en ${m.title}?`,
            options: [
              `Reducir la transparencia en la rendición de cuentas`,
              `Asegurar trazabilidad institucional, legalidad formal y validez probatoria`,
              `Eximir de responsabilidad disciplinaria a los intervinientes`,
              `Limitar el acceso a la defensa de las partes interesadas`,
            ],
            correct: 1,
          },
        ])
      : [
          {
            id: `q_${slug}_1`,
            text: `¿Cuál es el principio orientador en este programa de formación institucional?`,
            options: [
              'Asegurar el cumplimiento estricto del orden legal, constitucional y los derechos ciudadanos',
              'Proceder discrecionalmente sin fundamentación legal',
              'Omitir la trazabilidad documental de los procedimientos',
              'Actuar al margen de los protocolos institucionales vigentes',
            ],
            correct: 0,
          },
          {
            id: `q_${slug}_2`,
            text: `¿Qué finalidad primordial persigue la correcta fundamentación de las decisiones operativas y jurídicas?`,
            options: [
              'Eliminar la supervisión de las autoridades de control',
              'Brindar certeza, apego a derecho y legitimidad pública a la actuación institucional',
              'Acelerar trámites suprimiendo los términos legales del procedimiento',
              'Restringir la publicidad de los actos oficiales',
            ],
            correct: 1,
          },
        ];

    return {
      courseSlug: slug,
      title: examTitle,
      passingScore: 75,
      questions: defaultQuestions,
    };
  },

  async saveExam(exam: Exam): Promise<boolean> {
    // 1. Persistencia resiliente en Supabase
    try {
      await supabase.from('site_content').upsert({
        key: `exam_${exam.courseSlug}`,
        value: exam,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
    } catch {}

    try {
      await supabase.from('exams').upsert({
        course_slug: exam.courseSlug,
        title: exam.title,
        passing_score: exam.passingScore,
        questions: exam.questions,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    // 2. Almacenamiento local redundante y atómico
    const customExams = getLocalData<Exam[]>('custom_exams', []);
    const idx = customExams.findIndex(e => e.courseSlug === exam.courseSlug);
    if (idx >= 0) {
      customExams[idx] = exam;
    } else {
      customExams.unshift(exam);
    }
    setLocalData('custom_exams', customExams);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`eddip_exam_${exam.courseSlug}`, JSON.stringify(exam));
        localStorage.setItem('custom_exams', JSON.stringify(customExams));
        localStorage.setItem('eddip_exam_ping', Date.now().toString());
        // Notificar reactivamente a la vista de evaluación del estudiante y al panel admin
        window.dispatchEvent(new CustomEvent('eddip_exam_updated', { detail: exam }));
        window.dispatchEvent(new CustomEvent('eddip_exams_updated', { detail: exam }));
      } catch {}
    }

    try {
      await supabase.from('site_content').upsert({
        key: 'admin_exams_list',
        value: customExams,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
    } catch {}

    return true;
  },

  // ==========================================
  // CERTIFICADOS Y VENTAS
  // ==========================================
  async issueManualCertificate(cert: Certificate): Promise<boolean> {
    const lower = cert.code.trim().toLowerCase();

    try {
      await supabase.from('certificates').upsert({
        code: cert.code,
        student_name: cert.student,
        course_slug: cert.courseSlug,
        course_title: cert.course,
        hours: cert.hours,
        status: cert.status || 'Válido',
        issue_date: cert.date,
      });
    } catch (e) {
      console.warn('Aviso tabla certificates:', e);
    }

    try {
      await supabase.from('site_content').upsert({
        key: `certificate_${lower}`,
        value: {
          code: cert.code,
          student: cert.student,
          studentName: cert.student,
          documentId: cert.documentId,
          courseSlug: cert.courseSlug,
          course: cert.course,
          courseTitle: cert.course,
          hours: cert.hours,
          status: cert.status || 'Válido',
          date: cert.date,
          issueDate: cert.date,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn('Aviso site_content certificado:', e);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`eddip_cert_${lower}`, JSON.stringify(cert));
      } catch {}
    }

    const allCerts = getLocalData<Certificate[]>('admin_certs', certificates);
    const existingIdx = allCerts.findIndex(c => c.code.toLowerCase() === lower);
    if (existingIdx >= 0) {
      allCerts[existingIdx] = cert;
    } else {
      allCerts.unshift(cert);
    }
    setLocalData('admin_certs', allCerts);
    setLocalData('eddip_student_certificates_list', allCerts);
    return true;
  },

  // ==========================================
  // VENTAS / GESTIÓN COMERCIAL SINCRONIZADA CON BASE DE DATOS REAL
  // ==========================================
  async getSalesHistory(): Promise<Sale[]> {
    // 1. Helper para descartar transacciones mock de prueba (VEN-1001 a VEN-1018)
    const isMockSale = (s: Partial<Sale>) => {
      if (!s || !s.id) return false;
      if (
        /^VEN-10[0-1]\d$/.test(s.id) &&
        [
          'Sebastián Martínez',
          'Laura Gómez',
          'Carlos Rodríguez',
          'Natalia Pérez',
          'Andrés Torres',
          'Juliana Castro',
          'Felipe Vargas',
          'Valeria Morales',
          'Daniel Ruiz',
          'Mariana Duarte',
        ].includes(s.student || '')
      ) {
        return true;
      }
      return false;
    };

    // 2. Intentar cargar desde Supabase site_content con clave 'admin_sales_list'
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', 'admin_sales_list')
        .maybeSingle();

      if (!error && data && data.value && Array.isArray(data.value)) {
        const filteredRemote = (data.value as Sale[]).filter(s => !isMockSale(s));
        setLocalData('admin_sales', filteredRemote);
        return filteredRemote;
      }
    } catch (err) {
      console.warn('Error fetching sales from Supabase:', err);
    }

    // 3. Almacenamiento local real (limpiando cualquier residuo de mock)
    const rawLocal = getLocalData<Sale[]>('admin_sales', []);
    const sanitizedLocal = rawLocal.filter(s => !isMockSale(s));
    if (rawLocal.length !== sanitizedLocal.length && typeof window !== 'undefined') {
      setLocalData('admin_sales', sanitizedLocal);
    }

    return sanitizedLocal;
  },

  async recordSale(sale: Sale): Promise<boolean> {
    const list = await this.getSalesHistory();
    const existingIdx = list.findIndex(s => s.id === sale.id);
    let updated: Sale[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = sale;
    } else {
      updated = [sale, ...list];
    }
    setLocalData('admin_sales', updated);

    // Persistir directamente en Supabase tabla site_content
    try {
      await supabase.from('site_content').upsert(
        {
          key: 'admin_sales_list',
          value: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    } catch (err) {
      console.warn('Error recording sale in Supabase site_content:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eddip_sales_updated', { detail: updated }));
      try {
        localStorage.setItem('eddip_sales_ping', Date.now().toString());
      } catch {}
    }
    return true;
  },

  async updateSaleStatus(saleId: string, newStatus: string): Promise<boolean> {
    const list = await this.getSalesHistory();
    const updated = list.map(s => (s.id === saleId ? { ...s, status: newStatus } : s));
    setLocalData('admin_sales', updated);

    try {
      await supabase.from('site_content').upsert(
        {
          key: 'admin_sales_list',
          value: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    } catch (err) {
      console.warn('Error updating sale status in Supabase:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eddip_sales_updated', { detail: updated }));
      try {
        localStorage.setItem('eddip_sales_ping', Date.now().toString());
      } catch {}
    }
    return true;
  },

  async deleteSale(saleId: string): Promise<boolean> {
    const list = await this.getSalesHistory();
    const updated = list.filter(s => s.id !== saleId);
    setLocalData('admin_sales', updated);

    try {
      await supabase.from('site_content').upsert(
        {
          key: 'admin_sales_list',
          value: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    } catch (err) {
      console.warn('Error deleting sale in Supabase:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eddip_sales_updated', { detail: updated }));
      try {
        localStorage.setItem('eddip_sales_ping', Date.now().toString());
      } catch {}
    }
    return true;
  },

  async enrollStudentInCourse(
    studentName: string,
    studentEmail: string,
    courseSlug: string,
    courseTitle: string,
    extraData?: { documentId?: string; phone?: string; city?: string }
  ): Promise<void> {
    const cleanEmail = (studentEmail || '').trim().toLowerCase();
    const cleanName = (studentName || '').trim() || 'Estudiante Matriculado';
    const studentsList = await this.getAllStudents();

    let student = studentsList.find(s => s.email.toLowerCase() === cleanEmail);
    if (!student && extraData?.documentId) {
      const normDoc = extraData.documentId.replace(/[\s.-]/g, '');
      if (normDoc) {
        student = studentsList.find(s => (s.documentId || '').replace(/[\s.-]/g, '') === normDoc);
      }
    }

    if (student) {
      if (extraData?.documentId && !student.documentId) student.documentId = extraData.documentId.trim();
      if (extraData?.phone && !student.phone) student.phone = extraData.phone.trim();
      if (extraData?.city && (!student.city || student.city === 'Colombia')) student.city = extraData.city.trim();

      const existsCourse = student.enrolledCourses.some(c => c.slug === courseSlug);
      if (!existsCourse) {
        student.enrolledCourses.push({
          slug: courseSlug,
          title: courseTitle,
          progress: 0,
          completedLessons: [],
          totalLessons: 1,
        });
        student.coursesCount = student.enrolledCourses.length;
      }
      student.status = 'Activo';
    } else {
      student = {
        id: `st-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        documentId: extraData?.documentId?.trim() || '',
        phone: extraData?.phone?.trim() || '',
        city: extraData?.city?.trim() || 'Colombia',
        coursesCount: 1,
        progressAvg: 0,
        certificatesCount: 0,
        registeredAt: new Date().toISOString().slice(0, 10),
        status: 'Activo',
        enrolledCourses: [
          {
            slug: courseSlug,
            title: courseTitle,
            progress: 0,
            completedLessons: [],
            totalLessons: 1,
          },
        ],
        examScores: [],
      };
      studentsList.unshift(student);
    }

    // Persistir en Supabase
    try {
      await supabase.from('site_content').upsert({
        key: 'admin_students_list',
        value: studentsList,
        updated_at: new Date().toISOString(),
      });
      await supabase.from('profiles').upsert({
        id: student.id,
        email: cleanEmail,
        full_name: student.name,
        document_id: student.documentId || '',
        phone: student.phone || '',
        city: student.city || '',
        role: 'student',
        updated_at: new Date().toISOString(),
      });
      await supabase.from('enrollments').upsert({
        student_id: student.id,
        course_slug: courseSlug,
        enrolled_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Error saving enrollment to Supabase:', err);
    }

    setLocalData('custom_students', studentsList);
    setLocalData('eddip_admin_custom_students', studentsList);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eddip_students_updated', { detail: studentsList }));
      try {
        localStorage.setItem('eddip_students_ping', Date.now().toString());
      } catch {}
    }
  },

  async deleteStudent(studentId: string): Promise<boolean> {
    const list = await this.getAllStudents();
    const updated = list.filter(s => s.id !== studentId);

    try {
      await supabase.from('site_content').upsert({
        key: 'admin_students_list',
        value: updated,
        updated_at: new Date().toISOString(),
      });
      await supabase.from('profiles').delete().eq('id', studentId);
    } catch (err) {
      console.warn('Error deleting student from Supabase:', err);
    }

    setLocalData('custom_students', updated);
    setLocalData('eddip_admin_custom_students', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eddip_students_updated', { detail: updated }));
    }
    return true;
  },

  // ==========================================
  // GESTIÓN INTEGRAL DE ROLES Y USUARIOS (RBAC)
  // ==========================================
  async getUserAccounts(): Promise<RegisteredAccount[]> {
    // 1. Obtener cuentas registradas en site_content y local
    const registered = await getRegisteredAccounts();

    // 2. Obtener perfiles de la tabla profiles de Supabase
    let profilesList: any[] = [];
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data)) {
        profilesList = data;
      }
    } catch {}

    // 3. Obtener estudiantes del directorio institucional
    const students = await this.getAllStudents();

    // 4. Consolidar en un mapa unificado por correo electrónico
    const userMap = new Map<string, RegisteredAccount>();

    // Cuentas institucionales preconfiguradas garantizadas
    const defaultAccounts: RegisteredAccount[] = [
      {
        id: 'admin-seed-01',
        email: 'admin@eddip.edu.co',
        fullName: 'Administrador EDDIP',
        documentId: '99.888.777',
        phone: '310 999 0000',
        city: 'Bogotá D.C.',
        role: 'admin',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'designer-seed-01',
        email: 'disenador@eddip.edu.co',
        fullName: 'Diseñador Instruccional',
        documentId: '88.777.666',
        phone: '312 444 5566',
        city: 'Bogotá D.C.',
        role: 'designer',
        createdAt: '2026-01-12T08:00:00.000Z',
      },
      {
        id: 'student-seed-01',
        email: 'estudiante@eddip.edu.co',
        fullName: 'Sebastián Martínez',
        documentId: '1.032.456.789',
        phone: '300 555 0182',
        city: 'Bogotá D.C.',
        role: 'student',
        createdAt: '2026-01-15T08:00:00.000Z',
      },
    ];

    for (const d of defaultAccounts) {
      userMap.set(d.email.toLowerCase().trim(), d);
    }

    // Agregar cuentas de estudiantes
    for (const s of students) {
      if (!s.email) continue;
      const clean = s.email.toLowerCase().trim();
      const existing = userMap.get(clean);
      userMap.set(clean, {
        id: s.id,
        email: clean,
        fullName: s.name,
        documentId: s.documentId || existing?.documentId || '',
        phone: s.phone || existing?.phone || '',
        city: s.city || existing?.city || 'Colombia',
        role: s.role || existing?.role || 'student',
        createdAt: s.registeredAt || existing?.createdAt || new Date().toISOString(),
      });
    }

    // Agregar o actualizar con cuentas registradas (mayor fidelidad de credenciales/roles)
    for (const r of registered) {
      if (!r.email) continue;
      const clean = r.email.toLowerCase().trim();
      const existing = userMap.get(clean);
      userMap.set(clean, {
        id: r.id || existing?.id || generateUUID(),
        email: clean,
        fullName: r.fullName || existing?.fullName || clean.split('@')[0],
        documentId: r.documentId || existing?.documentId || '',
        phone: r.phone || existing?.phone || '',
        city: r.city || existing?.city || 'Colombia',
        role: r.role || existing?.role || 'student',
        createdAt: r.createdAt || existing?.createdAt || new Date().toISOString(),
      });
    }

    // Combinar perfiles de Supabase
    for (const p of profilesList) {
      if (!p.email) continue;
      const clean = p.email.toLowerCase().trim();
      const existing = userMap.get(clean);
      userMap.set(clean, {
        id: p.id || existing?.id || generateUUID(),
        email: clean,
        fullName: p.full_name || existing?.fullName || clean.split('@')[0],
        documentId: p.document_id || existing?.documentId || '',
        phone: p.phone || existing?.phone || '',
        city: p.city || existing?.city || 'Colombia',
        role: (p.role as 'student' | 'designer' | 'admin') || existing?.role || 'student',
        createdAt: p.created_at || existing?.createdAt || new Date().toISOString(),
      });
    }

    return Array.from(userMap.values());
  },

  async updateUserRole(
    emailOrId: string,
    newRole: 'student' | 'designer' | 'admin'
  ): Promise<{ success: boolean; error?: string }> {
    const list = await this.getUserAccounts();
    const cleanKey = emailOrId.toLowerCase().trim();
    const target = list.find(u => u.email.toLowerCase().trim() === cleanKey || u.id === emailOrId);

    if (!target) {
      return { success: false, error: 'Usuario no encontrado en el sistema.' };
    }

    const updatedUser: RegisteredAccount = {
      ...target,
      role: newRole,
    };

    // 1. Guardar en registered accounts
    await saveRegisteredAccount(updatedUser);

    // 2. Actualizar en Supabase tabla profiles
    try {
      await supabase.from('profiles').upsert({
        id: target.id,
        email: target.email.toLowerCase().trim(),
        full_name: target.fullName,
        document_id: target.documentId || '',
        phone: target.phone || '',
        city: target.city || 'Colombia',
        role: newRole,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Advertencia al actualizar rol en tabla profiles de Supabase:', e);
    }

    // 3. Sincronizar directorio de estudiantes
    try {
      const students = await this.getAllStudents();
      const studentIdx = students.findIndex(s => s.email.toLowerCase().trim() === target.email.toLowerCase().trim());
      if (studentIdx >= 0) {
        students[studentIdx] = {
          ...students[studentIdx],
          role: newRole,
        };
        await supabase.from('site_content').upsert({
          key: 'admin_students_list',
          value: students,
          updated_at: new Date().toISOString(),
        });
        setLocalData('custom_students', students);
        setLocalData('eddip_admin_custom_students', students);
      } else if (newRole === 'student') {
        await this.saveStudent({
          id: target.id,
          name: target.fullName,
          email: target.email,
          documentId: target.documentId,
          phone: target.phone,
          city: target.city,
          role: 'student',
          status: 'Activo',
        });
      }
    } catch (e) {
      console.warn('Advertencia al sincronizar lista de estudiantes:', e);
    }

    // 4. Si es la cuenta en sesión activa, actualizar sesión local
    if (typeof window !== 'undefined') {
      try {
        const rawLocalUser = localStorage.getItem(`eddip_user_${target.email.toLowerCase().trim()}`);
        if (rawLocalUser) {
          const parsed = JSON.parse(rawLocalUser);
          parsed.role = newRole;
          localStorage.setItem(`eddip_user_${target.email.toLowerCase().trim()}`, JSON.stringify(parsed));
        }
        const currentActive = localStorage.getItem('eddip-demo-v2');
        if (currentActive) {
          const parsedActive = JSON.parse(currentActive);
          if (parsedActive.userProfile?.email?.toLowerCase().trim() === target.email.toLowerCase().trim()) {
            parsedActive.role = newRole;
            localStorage.setItem('eddip-demo-v2', JSON.stringify(parsedActive));
          }
        }
      } catch {}

      window.dispatchEvent(new CustomEvent('eddip_roles_updated', { detail: { email: target.email, role: newRole } }));
      window.dispatchEvent(new CustomEvent('eddip_students_updated'));
    }

    return { success: true };
  },

  async createUserWithRole(data: {
    fullName: string;
    email: string;
    role: 'student' | 'designer' | 'admin';
    documentId?: string;
    phone?: string;
    city?: string;
    password?: string;
  }): Promise<{ success: boolean; error?: string; account?: RegisteredAccount }> {
    const cleanEmail = (data.email || '').toLowerCase().trim();
    const cleanName = (data.fullName || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!cleanName) {
      return { success: false, error: 'Por favor ingresa el nombre completo del usuario.' };
    }

    const dupCheck = await this.isStudentDuplicate(cleanEmail, data.documentId?.trim() || '');
    if (dupCheck.isDuplicate) {
      return { success: false, error: dupCheck.message || 'Ya existe un usuario con este correo o documento.' };
    }

    const newAcc: RegisteredAccount = {
      id: generateUUID(),
      email: cleanEmail,
      fullName: cleanName,
      documentId: data.documentId?.trim() || '',
      phone: data.phone?.trim() || '',
      city: data.city?.trim() || 'Colombia',
      password: data.password || generateUUID().slice(0, 12),
      role: data.role,
      createdAt: new Date().toISOString(),
    };

    // 1. Guardar en registered accounts
    await saveRegisteredAccount(newAcc);

    // 2. Guardar en tabla profiles de Supabase
    try {
      await supabase.from('profiles').upsert({
        id: newAcc.id,
        email: cleanEmail,
        full_name: cleanName,
        document_id: newAcc.documentId,
        phone: newAcc.phone,
        city: newAcc.city,
        role: data.role,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Advertencia al guardar perfil en Supabase:', err);
    }

    // 3. Si el rol es estudiante, agregarlo al directorio
    if (data.role === 'student') {
      await this.saveStudent({
        id: newAcc.id,
        name: cleanName,
        email: cleanEmail,
        documentId: newAcc.documentId,
        phone: newAcc.phone,
        city: newAcc.city,
        role: 'student',
        status: 'Activo',
        coursesCount: 0,
        progressAvg: 0,
        certificatesCount: 0,
        registeredAt: new Date().toISOString().slice(0, 10),
        enrolledCourses: [],
        examScores: [],
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eddip_roles_updated', { detail: newAcc }));
    }

    return { success: true, account: newAcc };
  },

  async deleteUserAccount(userIdOrEmail: string): Promise<boolean> {
    const accounts = await this.getUserAccounts();
    const clean = userIdOrEmail.toLowerCase().trim();
    const updated = accounts.filter(a => a.id !== userIdOrEmail && a.email.toLowerCase().trim() !== clean);

    try {
      await supabase.from('site_content').upsert({
        key: 'eddip_registered_users',
        value: updated,
        updated_at: new Date().toISOString(),
      });
      await supabase.from('profiles').delete().or(`id.eq.${userIdOrEmail},email.eq.${clean}`);
    } catch (err) {
      console.warn('Error al eliminar cuenta en Supabase:', err);
    }

    setLocalData('registered_accounts', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eddip_roles_updated', { detail: updated }));
    }
    return true;
  },
};
