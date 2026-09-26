'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { adminService } from '@/lib/supabase/adminService';
import { StudentExamModule } from '@/components/student/StudentExamModule';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import type { Exam } from '@/lib/types';

export default function StudentExamPage() {
  const { slug } = useParams<{ slug: string }>();
  const { courses } = useDemo();

  const course = courses.find(c => c.slug === slug);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const loadExam = async () => {
      const resolved = await adminService.getExamBySlug(slug, course);
      if (isMounted) {
        setExam(resolved);
        setLoading(false);
      }
    };

    loadExam();

    // Sincronización en tiempo real: escuchar si administración actualiza la prueba
    const handleExamUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<Exam>;
      if (customEvent.detail && customEvent.detail.courseSlug === slug) {
        setExam(customEvent.detail);
      } else {
        loadExam();
      }
    };

    window.addEventListener('eddip_exam_updated', handleExamUpdated);
    window.addEventListener('storage', loadExam);

    return () => {
      isMounted = false;
      window.removeEventListener('eddip_exam_updated', handleExamUpdated);
      window.removeEventListener('storage', loadExam);
    };
  }, [slug, course]);

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
