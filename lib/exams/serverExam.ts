import crypto from 'crypto';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { STUDENT_DIRECTORY_KEY } from '@/lib/auth/accounts';
import type { CourseRecord } from '@/lib/courses/serverCourse';
import { exams as baseExams } from '@/lib/data';
import type { EnrichedStudent } from '@/lib/studentDirectory';
import { readContentList } from '@/lib/supabase/server';
import type { IssuedCertificate } from '@/lib/supabase/types';
import type { Exam } from '@/lib/types';
import { buildDefaultExam, DEFAULT_PASSING_SCORE, isUsableExam } from './examRules';

/**
 * Lectura de evaluaciones y emisión de certificados exclusivamente en el servidor (service role).
 * Las respuestas correctas nunca salen de este módulo.
 */

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;
const MAX_CODE_ATTEMPTS = 5;

function normalizeExam(value: unknown): Exam | null {
  const parsed = typeof value === 'string' ? safeParse(value) : value;
  if (!isUsableExam(parsed)) return null;
  return { ...parsed, passingScore: Number(parsed.passingScore) || DEFAULT_PASSING_SCORE };
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Misma prioridad que administración: clave propia del curso, lista general, tabla heredada, catálogo base. */
export async function loadExamForCourse(admin: SupabaseClient, course: CourseRecord): Promise<Exam> {
  const { data: direct } = await admin.from('site_content').select('value').eq('key', `exam_${course.slug}`).maybeSingle();
  const fromKey = normalizeExam(direct?.value);
  if (fromKey) return fromKey;

  const list = await readContentList<unknown>(admin, 'admin_exams_list');
  const fromList = list.map(normalizeExam).find(e => e?.courseSlug === course.slug);
  if (fromList) return fromList;

  const { data: legacy, error: legacyError } = await admin
    .from('exams')
    .select('course_slug, title, passing_score, questions')
    .eq('course_slug', course.slug)
    .maybeSingle();
  if (!legacyError && legacy) {
    const fromTable = normalizeExam({
      courseSlug: legacy.course_slug,
      title: legacy.title,
      passingScore: legacy.passing_score,
      questions: legacy.questions,
    });
    if (fromTable) return fromTable;
  }

  const fromBase = normalizeExam(baseExams.find(e => e.courseSlug === course.slug));
  return fromBase || buildDefaultExam(course);
}

/** Matrícula registrada en la tabla enrollments o asignada por administración en el directorio. */
export async function isEnrolledInCourse(admin: SupabaseClient, user: User, courseSlug: string): Promise<boolean> {
  const { data } = await admin
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_slug', courseSlug)
    .maybeSingle();
  if (data) return true;

  const email = (user.email || '').toLowerCase();
  if (!email) return false;
  const directory = await readContentList<EnrichedStudent>(admin, STUDENT_DIRECTORY_KEY);
  return directory.some(
    s => (s.id === user.id || s.email?.toLowerCase() === email) && s.enrolledCourses?.some(c => c.slug === courseSlug)
  );
}

function generateCertificateCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  const suffix = Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `EDDIP-${new Date().getFullYear()}-${suffix}`;
}

type CertificateRow = {
  code: string;
  student_name: string;
  document_id: string | null;
  course_slug: string;
  course_title: string;
  hours: number;
  status: 'Válido' | 'Revocado';
  issue_date: string;
};

const toIssuedCertificate = (row: CertificateRow): IssuedCertificate => ({
  code: row.code,
  studentName: row.student_name,
  documentId: row.document_id || undefined,
  courseSlug: row.course_slug,
  courseTitle: row.course_title,
  hours: Number(row.hours) || 40,
  status: row.status,
  issueDate: row.issue_date,
});

/**
 * Emite el certificado de un curso aprobado con el nombre y la cédula registrados en profiles.
 * Si la persona ya tiene un certificado válido del mismo curso, se devuelve ese.
 */
export async function issueCourseCertificate(
  admin: SupabaseClient,
  user: User,
  course: CourseRecord
): Promise<IssuedCertificate | null> {
  const { data: existing } = await admin
    .from('certificates')
    .select('code, student_name, document_id, course_slug, course_title, hours, status, issue_date')
    .eq('student_id', user.id)
    .eq('course_slug', course.slug)
    .eq('status', 'Válido')
    .limit(1)
    .maybeSingle();
  if (existing) return toIssuedCertificate(existing as CertificateRow);

  const { data: profile } = await admin.from('profiles').select('full_name, document_id').eq('id', user.id).maybeSingle();
  const studentName = String(profile?.full_name || '').trim() || user.email || 'Estudiante EDDIP';
  const documentId = String(profile?.document_id || '').trim() || null;
  const issueDate = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date());

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const { data, error } = await admin
      .from('certificates')
      .insert({
        code: generateCertificateCode(),
        student_id: user.id,
        student_name: studentName,
        document_id: documentId,
        course_slug: course.slug,
        course_title: course.title,
        hours: course.durationHours,
        status: 'Válido',
        issue_date: issueDate,
      })
      .select('code, student_name, document_id, course_slug, course_title, hours, status, issue_date')
      .single();
    if (!error && data) return toIssuedCertificate(data as CertificateRow);
    // 23505: código repetido; se reintenta con uno nuevo
    if (error?.code !== '23505') {
      console.error('No fue posible emitir el certificado:', error?.message);
      return null;
    }
  }
  return null;
}
