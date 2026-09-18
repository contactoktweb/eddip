'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { allLessons } from '@/lib/data';

export default function CourseLearnIndexPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { courses, completed } = useDemo();

  const course = courses.find(c => c.slug === slug);

  useEffect(() => {
    if (course) {
      const lessons = allLessons(course);
      if (lessons.length > 0) {
        const completedList = completed[slug] || [];
        const nextLesson = lessons.find(l => !completedList.includes(l.id)) || lessons[0];
        router.replace(`/aprender/${slug}/${nextLesson.id}`);
      }
    }
  }, [course, slug, completed, router]);

  if (!course) {
    return (
      <main className="section container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Curso no encontrado</h1>
        <p style={{ color: '#68788d', marginBottom: 20 }}>
          El programa formativo que buscas no está disponible en la plataforma.
        </p>
        <Link className="btn btn-primary" href="/dashboard/cursos">
          Volver a mis cursos
        </Link>
      </main>
    );
  }

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Cargando aula virtual de {course.title}...</p>
      </div>
    </div>
  );
}
