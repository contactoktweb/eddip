'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { studentService } from '@/lib/supabase/studentService';
import { StudentExamModule } from '@/components/student/StudentExamModule';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import type { PublicExam } from '@/lib/exams/examRules';

export default function StudentExamPage() {
  const { slug } = useParams<{ slug: string }>();
  const { courses, sessionReady } = useDemo();

  const course = courses.find(c => c.slug === slug);
  const [exam, setExam] = useState<PublicExam | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !sessionReady) return;
    let isMounted = true;

    studentService.getStudentExam(slug).then(({ exam: loaded, error }) => {
      if (!isMounted) return;
      setExam(loaded);
      setLoadError(error);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [slug, sessionReady]);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="exam-page" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px' }} />
            <p style={{ color: '#68788d', fontSize: 14 }}>
              Cargando cuestionario oficial de certificación desde la administración...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!course || !exam) {
    return (
      <>
        <SiteHeader />
        <main className="exam-page" style={{ minHeight: '70vh' }}>
          <div className="exam-shell" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>Evaluación no disponible</h1>
            <p style={{ color: '#68788d', marginBottom: 20 }}>
              {loadError || 'El curso indicado no dispone de una evaluación activa en este momento.'}
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
