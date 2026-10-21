import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { findCourseRecord } from '@/lib/courses/serverCourse';
import { toPublicExam } from '@/lib/exams/examRules';
import { isEnrolledInCourse, loadExamForCourse } from '@/lib/exams/serverExam';

type RouteContext = { params: Promise<{ slug: string }> };

/** Entrega la evaluación del curso sin las respuestas correctas, solo a estudiantes matriculados o al personal académico. */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { slug } = await context.params;
  const { admin, user, role } = auth.session;
  const course = await findCourseRecord(admin, slug);
  if (!course) return NextResponse.json({ error: 'El curso indicado no existe.' }, { status: 404 });

  const isStaff = role === 'admin' || role === 'designer';
  if (!isStaff && !(await isEnrolledInCourse(admin, user, course.slug))) {
    return NextResponse.json({ error: 'Debes estar matriculado en el curso para presentar la evaluación.' }, { status: 403 });
  }

  const exam = await loadExamForCourse(admin, course);
  return NextResponse.json({ exam: toPublicExam(exam) }, { headers: { 'Cache-Control': 'no-store' } });
}
