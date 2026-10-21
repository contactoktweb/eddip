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

export type DirectoryEnrollment = {
  studentId?: string;
  name: string;
  email: string;
  courseSlug: string;
  courseTitle: string;
  documentId?: string;
  phone?: string;
  city?: string;
};

const normalizeDocument = (doc?: string) => (doc || '').replace(/[\s.-]/g, '');

/**
 * Matricula a la persona en el directorio institucional (la crea si no existe) sin duplicar cursos.
 * Devuelve la lista actualizada y el registro afectado; no modifica la lista recibida.
 */
export function applyEnrollmentToDirectory(
  list: EnrichedStudent[],
  enrollment: DirectoryEnrollment
): { list: EnrichedStudent[]; student: EnrichedStudent } {
  const email = enrollment.email.trim().toLowerCase();
  const doc = normalizeDocument(enrollment.documentId);
  const index = list.findIndex(
    s => s.email.toLowerCase() === email || (doc.length > 0 && normalizeDocument(s.documentId) === doc)
  );
  const course = { slug: enrollment.courseSlug, title: enrollment.courseTitle, progress: 0, completedLessons: [], totalLessons: 1 };

  if (index >= 0) {
    const current = list[index];
    const enrolledCourses = current.enrolledCourses.some(c => c.slug === course.slug)
      ? current.enrolledCourses
      : [...current.enrolledCourses, course];
    const student: EnrichedStudent = {
      ...current,
      documentId: current.documentId || enrollment.documentId?.trim() || '',
      phone: current.phone || enrollment.phone?.trim() || '',
      city: !current.city || current.city === 'Colombia' ? enrollment.city?.trim() || current.city : current.city,
      enrolledCourses,
      coursesCount: enrolledCourses.length,
      status: 'Activo',
    };
    const next = [...list];
    next[index] = student;
    return { list: next, student };
  }

  const student: EnrichedStudent = {
    id: enrollment.studentId || `st-${Date.now()}`,
    name: enrollment.name.trim() || 'Estudiante Matriculado',
    email,
    documentId: enrollment.documentId?.trim() || '',
    phone: enrollment.phone?.trim() || '',
    city: enrollment.city?.trim() || 'Colombia',
    coursesCount: 1,
    progressAvg: 0,
    certificatesCount: 0,
    registeredAt: new Date().toISOString().slice(0, 10),
    status: 'Activo',
    role: 'student',
    enrolledCourses: [course],
    examScores: [],
  };
  return { list: [student, ...list], student };
}
