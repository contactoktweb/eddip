import { supabase } from './client';
import type { Course, Exam, Certificate, Sale } from '@/lib/types';
import { baseCourses, certificates, sales, students } from '@/lib/data';

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
    try {
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
        instructor: course.instructor,
        outcomes: course.outcomes,
        modules: course.modules,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Fallback
    }

    const extraCourses = getLocalData<Course[]>('extra_courses', []);
    const existsIndex = extraCourses.findIndex(c => c.slug === course.slug || c.id === course.id);
    if (existsIndex >= 0) {
      extraCourses[existsIndex] = course;
    } else {
      extraCourses.unshift(course);
    }
    setLocalData('extra_courses', extraCourses);

    return { success: true, error: null };
  },

  async deleteCourse(slug: string): Promise<boolean> {
    try {
      await supabase.from('courses').delete().eq('slug', slug);
    } catch {
      // Fallback
    }

    const extraCourses = getLocalData<Course[]>('extra_courses', []);
    setLocalData('extra_courses', extraCourses.filter(c => c.slug !== slug));
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
  async saveExam(exam: Exam): Promise<boolean> {
    try {
      await supabase.from('exams').upsert({
        course_slug: exam.courseSlug,
        title: exam.title,
        passing_score: exam.passingScore,
        questions: exam.questions,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Fallback
    }

    const customExams = getLocalData<Exam[]>('custom_exams', []);
    const idx = customExams.findIndex(e => e.courseSlug === exam.courseSlug);
    if (idx >= 0) {
      customExams[idx] = exam;
    } else {
      customExams.unshift(exam);
    }
    setLocalData('custom_exams', customExams);
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
