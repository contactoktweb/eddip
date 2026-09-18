'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { exams } from '@/lib/data';
import { useDemo } from '@/app/providers';
import { StudentExamModule } from '@/components/student/StudentExamModule';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import type { Exam } from '@/lib/types';

export default function StudentExamPage() {
  const { slug } = useParams<{ slug: string }>();
  const { courses } = useDemo();

  const course = courses.find(c => c.slug === slug);
  let exam = exams.find(x => x.courseSlug === slug);

  // Si el curso existe pero no tiene examen en exams.json, generar evaluación dinámica
  if (!exam && course) {
    exam = {
      courseSlug: course.slug,
      title: `Evaluación de Certificación — ${course.title}`,
      passingScore: 75,
      questions: course.modules.flatMap((m, mIdx) => [
        {
          id: `q_dyn_${mIdx}_1`,
          text: `En relación con ${m.title}, ¿cuál es el criterio fundamental para su correcta aplicación?`,
          options: [
            `Analizar el marco normativo y la proporcionalidad de la actuación`,
            `Omitir el registro documental del caso`,
            `Actuar sin fundamentación jurídica`,
            `Delegar la responsabilidad sin verificación previa`,
          ],
          correct: 0,
        },
        {
          id: `q_dyn_${mIdx}_2`,
          text: `¿Qué beneficio garantiza el cumplimiento de los protocolos vistos en este módulo?`,
          options: [
            `Reducir la transparencia en la gestión`,
            `Asegurar trazabilidad, apego a derecho y validez institucional`,
            `Evitar la rendición de cuentas`,
            `Acelerar trámites eliminando garantías fundamentales`,
          ],
          correct: 1,
        },
      ]),
    } as Exam;
  }

  if (!course || !exam) {
    return (
      <>
        <SiteHeader />
        <main className="exam-page" style={{ minHeight: '70vh' }}>
          <div className="exam-shell" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>Evaluación no encontrada</h1>
            <p style={{ color: '#68788d', marginBottom: 20 }}>
              El curso indicado no dispone de una evaluación activa en este momento.
            </p>
            <Link className="btn btn-primary" href="/dashboard/cursos">
              Volver a mis cursos
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="exam-page" style={{ minHeight: '80vh', padding: '40px 16px 80px' }}>
        <StudentExamModule exam={exam} course={course} />
      </main>
      <Footer />
    </>
  );
}
