import { supabase } from './client';
import type { Course, Exam, ExamQuestion, Certificate, Sale } from '@/lib/types';
import { baseCourses, certificates, sales, students, exams as baseExams } from '@/lib/data';

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

const STUDENT_ENROLLMENTS: Record<string, {
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
}> = {
  'st-001': {
    enrolledCourses: [
      {
        slug: 'derecho-de-policia',
        title: 'Derecho de Policía',
        progress: 100,
        completedLessons: ['dp-l1'],
        totalLessons: 1,
        certificateCode: 'EDDIP-2026-000145',
      },
      {
        slug: 'fundamentos-seguridad-convivencia',
        title: 'Fundamentos de Seguridad y Convivencia Ciudadana',
        progress: 75,
        completedLessons: ['fsc-l1'],
        totalLessons: 1,
        certificateCode: 'EDDIP-2026-000139',
      },
    ],
    examScores: [
      {
        courseSlug: 'derecho-de-policia',
        courseTitle: 'Derecho de Policía',
        score: 95,
        passed: true,
        date: '15 de agosto de 2026',
      },
    ],
  },
  'st-002': {
    enrolledCourses: [
      {
        slug: 'derecho-de-policia',
        title: 'Derecho de Policía',
        progress: 100,
        completedLessons: ['dp-l1'],
        totalLessons: 1,
        certificateCode: 'EDDIP-2026-000128',
      },
      {
        slug: 'derecho-administrativo-contemporaneo',
        title: 'Derecho Administrativo Contemporáneo',
        progress: 30,
        completedLessons: [],
        totalLessons: 1,
      },
    ],
    examScores: [
      {
        courseSlug: 'derecho-de-policia',
        courseTitle: 'Derecho de Policía',
        score: 90,
        passed: true,
        date: '23 de julio de 2026',
      },
    ],
  },
  'st-003': {
    enrolledCourses: [
      {
        slug: 'derecho-de-policia',
        title: 'Derecho de Policía',
        progress: 100,
        completedLessons: ['dp-l1'],
        totalLessons: 1,
        certificateCode: 'EDDIP-2026-000112',
      },
      {
        slug: 'contratacion-estatal-normatividad',
        title: 'Contratación Estatal y Normatividad',
        progress: 85,
        completedLessons: ['cen-l1'],
        totalLessons: 1,
      },
    ],
    examScores: [
      {
        courseSlug: 'derecho-de-policia',
        courseTitle: 'Derecho de Policía',
        score: 92,
        passed: true,
        date: '12 de julio de 2026',
      },
    ],
  },
  'st-004': {
    enrolledCourses: [
      {
        slug: 'ciberseguridad-entornos-publicos',
        title: 'Ciberseguridad para Entornos Públicos',
        progress: 35,
        completedLessons: [],
        totalLessons: 1,
      },
    ],
    examScores: [],
  },
  'st-005': {
    enrolledCourses: [
      {
        slug: 'liderazgo-trabajo-equipo',
        title: 'Liderazgo y Trabajo en Equipo',
        progress: 60,
        completedLessons: ['lte-l1'],
        totalLessons: 1,
      },
    ],
    examScores: [],
  },
  'st-006': {
    enrolledCourses: [
      {
        slug: 'fundamentos-seguridad-convivencia',
        title: 'Fundamentos de Seguridad y Convivencia Ciudadana',
        progress: 80,
        completedLessons: ['fsc-l1'],
        totalLessons: 1,
      },
      {
        slug: 'gestion-publica-resultados',
        title: 'Gestión Pública por Resultados',
        progress: 70,
        completedLessons: ['gpr-l1'],
        totalLessons: 1,
      },
    ],
    examScores: [],
  },
  'st-007': {
    enrolledCourses: [
      {
        slug: 'derecho-de-policia',
        title: 'Derecho de Policía',
        progress: 60,
        completedLessons: [],
        totalLessons: 1,
      },
      {
        slug: 'contratacion-estatal-normatividad',
        title: 'Contratación Estatal y Normatividad',
        progress: 40,
        completedLessons: [],
        totalLessons: 1,
      },
    ],
    examScores: [],
  },
  'st-008': {
    enrolledCourses: [
      {
        slug: 'liderazgo-trabajo-equipo',
        title: 'Liderazgo y Trabajo en Equipo',
        progress: 80,
        completedLessons: ['lte-l1'],
        totalLessons: 1,
      },
      {
        slug: 'gestion-publica-resultados',
        title: 'Gestión Pública por Resultados',
        progress: 60,
        completedLessons: [],
        totalLessons: 1,
      },
    ],
    examScores: [],
  },
  'st-009': {
    enrolledCourses: [
      {
        slug: 'liderazgo-trabajo-equipo',
        title: 'Liderazgo y Trabajo en Equipo',
        progress: 60,
        completedLessons: ['lte-l1'],
        totalLessons: 1,
      },
      {
        slug: 'ciberseguridad-entornos-publicos',
        title: 'Ciberseguridad para Entornos Públicos',
        progress: 50,
        completedLessons: [],
        totalLessons: 1,
      },
    ],
    examScores: [],
  },
  'st-010': {
    enrolledCourses: [
      {
        slug: 'fundamentos-seguridad-convivencia',
        title: 'Fundamentos de Seguridad y Convivencia Ciudadana',
        progress: 85,
        completedLessons: ['fsc-l1'],
        totalLessons: 1,
      },
      {
        slug: 'derecho-administrativo-contemporaneo',
        title: 'Derecho Administrativo Contemporáneo',
        progress: 75,
        completedLessons: ['dac-l1'],
        totalLessons: 1,
      },
    ],
    examScores: [],
  },
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
  // ESTUDIANTES / JUGADORES
  // ==========================================
  async getAllStudents(): Promise<EnrichedStudent[]> {
    const baseList: EnrichedStudent[] = students.map((s, idx) => {
      const customData = STUDENT_ENROLLMENTS[s.id] || {
        enrolledCourses: [
          {
            slug: 'derecho-de-policia',
            title: 'Derecho de Policía',
            progress: s.progress,
            completedLessons: ['dp-l1'],
            totalLessons: 1,
            certificateCode: s.certificates > 0 ? `EDDIP-2026-00014${idx}` : undefined,
          },
        ],
        examScores: [],
      };

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        documentId: `1.0${30 + idx}.456.${780 + idx}`,
        phone: `300 ${500 + idx} 01${idx}`,
        city: idx % 2 === 0 ? 'Bogotá D.C.' : 'Medellín',
        coursesCount: customData.enrolledCourses.length,
        progressAvg: s.progress,
        certificatesCount: s.certificates,
        registeredAt: s.registeredAt,
        status: s.progress >= 100 ? 'Completado' : s.progress > 0 ? 'Activo' : 'Inactivo',
        enrolledCourses: customData.enrolledCourses,
        examScores: customData.examScores,
      };
    });

    const localStudents = getLocalData<EnrichedStudent[]>('custom_students', []);
    return [...localStudents, ...baseList];
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
    // 1. Revisar primero en LocalStorage para reactividad instantánea en cliente
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

    // 2. Revisar en Supabase (site_content y exams)
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

    // 2. Almacenamiento local redundante
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
        localStorage.setItem('custom_exams', JSON.stringify(customExams));
        // Notificar reactivamente a la vista de evaluación del estudiante y al panel admin
        window.dispatchEvent(new CustomEvent('eddip_exam_updated', { detail: exam }));
      } catch {}
    }

    return true;
  },

  // ==========================================
  // CERTIFICADOS Y VENTAS
  // ==========================================
  async issueManualCertificate(cert: Certificate): Promise<boolean> {
    try {
      await supabase.from('certificates').upsert({
        code: cert.code,
        student_name: cert.student,
        course_slug: cert.courseSlug,
        course_title: cert.course,
        hours: cert.hours,
        status: cert.status,
        issue_date: cert.date,
      });
    } catch {
      // Fallback
    }

    const allCerts = getLocalData<Certificate[]>('admin_certs', certificates);
    allCerts.unshift(cert);
    setLocalData('admin_certs', allCerts);
    return true;
  },

  recordSale(sale: Sale): void {
    const list = getLocalData<Sale[]>('admin_sales', sales);
    list.unshift(sale);
    setLocalData('admin_sales', list);
  },

  async getSalesHistory(): Promise<Sale[]> {
    return getLocalData<Sale[]>('admin_sales', sales);
  },

  enrollStudentInCourse(studentName: string, studentEmail: string, courseSlug: string, courseTitle: string): void {
    const localStudents = getLocalData<EnrichedStudent[]>('custom_students', []);
    const existing = localStudents.find(s => s.email.toLowerCase() === studentEmail.toLowerCase());
    if (existing) {
      if (!existing.enrolledCourses.some(c => c.slug === courseSlug)) {
        existing.enrolledCourses.push({
          slug: courseSlug,
          title: courseTitle,
          progress: 0,
          completedLessons: [],
          totalLessons: 1,
        });
        existing.coursesCount = existing.enrolledCourses.length;
        setLocalData('custom_students', localStudents);
      }
    } else {
      const newStudent: EnrichedStudent = {
        id: `st-${Date.now()}`,
        name: studentName,
        email: studentEmail,
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
      localStudents.unshift(newStudent);
      setLocalData('custom_students', localStudents);
    }
  },
};
