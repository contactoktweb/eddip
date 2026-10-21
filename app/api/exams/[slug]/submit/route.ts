import { NextResponse } from 'next/server';
import { readJsonBody } from '@/lib/api/body';
import { requireSession } from '@/lib/auth/session';
import { findCourseRecord } from '@/lib/courses/serverCourse';
import { gradeExam, type ExamAnswers } from '@/lib/exams/examRules';
import { isEnrolledInCourse, issueCourseCertificate, loadExamForCourse } from '@/lib/exams/serverExam';
import type { Exam } from '@/lib/types';

type RouteContext = { params: Promise<{ slug: string }> };

const MAX_ATTEMPTS_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

/** Solo conserva respuestas a preguntas existentes con un índice de opción válido. */
function readAnswers(value: unknown, exam: Exam): ExamAnswers | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const answers: ExamAnswers = {};
  for (const question of exam.questions) {
    const answer = raw[question.id];
    if (Number.isInteger(answer) && (answer as number) >= 0 && (answer as number) < question.options.length) {
      answers[question.id] = answer as number;
    }
  }
  return answers;
}

/**
 * Califica la evaluación en el servidor y, si se aprueba, emite el certificado con los datos
 * registrados en el perfil. El navegador solo envía las opciones elegidas.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { slug } = await context.params;
  const { admin, user } = auth.session;
  const course = await findCourseRecord(admin, slug);
  if (!course) return NextResponse.json({ error: 'El curso indicado no existe.' }, { status: 404 });

  if (!(await isEnrolledInCourse(admin, user, course.slug))) {
    return NextResponse.json({ error: 'Debes estar matriculado en el curso para presentar la evaluación.' }, { status: 403 });
  }

  const { count } = await admin
    .from('exam_results')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('course_slug', course.slug)
    .gte('submitted_at', new Date(Date.now() - ONE_HOUR_MS).toISOString());
  if ((count || 0) >= MAX_ATTEMPTS_PER_HOUR) {
    return NextResponse.json(
      { error: 'Alcanzaste el máximo de intentos por hora. Repasa las lecciones e inténtalo más tarde.' },
      { status: 429 }
    );
  }

  const body = await readJsonBody(request);
  const exam = await loadExamForCourse(admin, course);
  const answers = body ? readAnswers(body.answers, exam) : null;
  if (!answers) return NextResponse.json({ error: 'Las respuestas enviadas no son válidas.' }, { status: 400 });

  const grade = gradeExam(exam, answers);
  const issue = grade.passed ? await issueCourseCertificate(admin, user, course) : null;
  const certificate = issue?.certificate || null;

  const { error: resultError } = await admin.from('exam_results').insert({
    student_id: user.id,
    course_slug: course.slug,
    course_title: course.title,
    score: grade.score,
    passed: grade.passed,
    total_questions: grade.total,
    correct_answers: grade.correct,
    certificate_code: certificate?.code || null,
  });
  if (resultError) console.error('No fue posible guardar el resultado de la evaluación:', resultError.message);

  if (issue?.error) return NextResponse.json({ error: issue.error }, { status: 409 });
  return NextResponse.json({ ...grade, passingScore: exam.passingScore, certificate });
}
