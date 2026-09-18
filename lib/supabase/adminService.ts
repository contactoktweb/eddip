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

export const adminService = {
  // ==========================================
  // CURSOS Y CONTENIDO
  // ==========================================
  async saveCourse(course: Course): Promise<{ success: boolean; error: string | null }> {
    try {
      // Intentar guardar en Supabase si la tabla existe
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
        gradient: course.gradient,
        instructor: course.instructor,
        outcomes: course.outcomes,
        modules: course.modules,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Fallback
    }

    // Persistir localmente
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
    // Tomar base de estudiantes inicial
    const baseList: EnrichedStudent[] = students.map((s, idx) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      documentId: `1.0${30 + idx}.456.${780 + idx}`,
      phone: `300 ${500 + idx} 01${idx}`,
      city: idx % 2 === 0 ? 'Bogotá D.C.' : 'Medellín',
      coursesCount: s.courses,
      progressAvg: s.progress,
      certificatesCount: s.certificates,
      registeredAt: s.registeredAt,
      status: s.progress >= 100 ? 'Completado' : s.progress > 0 ? 'Activo' : 'Inactivo',
      enrolledCourses: [
        {
          slug: 'derecho-de-policia',
          title: 'Derecho de Policía y Convivencia',
          progress: s.progress,
          completedLessons: ['dp-l1', 'dp-l2', 'dp-l3'].slice(0, Math.ceil(s.progress / 25)),
          totalLessons: 8,
          certificateCode: s.certificates > 0 ? `EDDIP-2026-00014${idx}` : undefined,
        },
        {
          slug: 'gestion-documental',
          title: 'Gestión Documental y Archivo',
          progress: Math.max(0, s.progress - 20),
          completedLessons: ['gd-l1'],
          totalLessons: 6,
        },
      ],
      examScores: [
        {
          courseSlug: 'derecho-de-policia',
          courseTitle: 'Derecho de Policía y Convivencia',
          score: Math.min(100, Math.max(65, s.progress + 15)),
          passed: s.progress >= 70,
          date: '02 de septiembre de 2026',
        },
      ],
    }));

    // Leer estudiantes adicionales creados en local
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

  async getSalesHistory(): Promise<Sale[]> {
    return sales;
  },
};
