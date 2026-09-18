export type StudentProfile = {
  id: string;
  email: string;
  fullName: string;
  documentId?: string;
  phone?: string;
  city?: string;
  role: 'student' | 'admin';
  avatarUrl?: string;
  createdAt?: string;
};

export type CourseEnrollment = {
  id: string;
  studentId: string;
  courseSlug: string;
  enrolledAt: string;
  completedAt?: string | null;
  progressPercent: number;
};

export type LessonProgressRecord = {
  id?: string;
  studentId: string;
  courseSlug: string;
  lessonId: string;
  completed: boolean;
  updatedAt: string;
};

export type StudentNote = {
  id: string;
  studentId: string;
  courseSlug: string;
  lessonId: string;
  noteText: string;
  updatedAt: string;
};

export type ExamResultRecord = {
  id?: string;
  studentId: string;
  studentName: string;
  courseSlug: string;
  courseTitle: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  certificateCode?: string;
};

export type IssuedCertificate = {
  code: string;
  studentName: string;
  courseSlug: string;
  courseTitle: string;
  hours: number;
  issueDate: string;
  status: 'Válido' | 'Revocado';
  verificationUrl?: string;
};
