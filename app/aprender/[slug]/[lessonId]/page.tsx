'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { useDemo } from '@/app/providers';
import { allLessons } from '@/lib/data';
import { LessonSidebar } from '@/components/student/LessonSidebar';
import { LessonReaderContent } from '@/components/student/LessonReaderContent';
import { LessonNavigation } from '@/components/student/LessonNavigation';

import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';

export default function StudentReaderPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const { courses, completed, toggleLesson } = useDemo();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const course = courses.find(c => c.slug === slug);

  if (!course) {
    return (
      <>
        <SiteHeader />
        <main className="section container" style={{ textAlign: 'center', padding: '80px 20px', minHeight: '60vh' }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Curso no encontrado</h1>
          <p style={{ color: '#68788d', marginBottom: 20 }}>
            El programa formativo que buscas no está disponible o ha cambiado de dirección.
          </p>
          <Link className="btn btn-primary" href="/dashboard/cursos">
            Volver a mis cursos
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const lessons = allLessons(course);
  const currentIndex = lessons.findIndex(l => l.id === lessonId);
  const currentLesson = lessons[currentIndex] || lessons[0];
  const doneList = completed[slug] || [];
  const isLessonDone = doneList.includes(currentLesson.id);

  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : undefined;

  return (
    <div className="reader">
      {/* Barra lateral de módulos y lecciones */}
      <LessonSidebar
        course={course}
        currentLessonId={currentLesson.id}
        completedLessons={doneList}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Visor principal */}
      <section className="reader-main">
        {/* Barra superior del aula virtual */}
        <header className="reader-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="icon-btn reader-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir temario del curso"
            >
              <Icon name="menu" />
            </button>
            <Link className="text-link" href="/dashboard/cursos" style={{ fontSize: 13 }}>
              ← Mis cursos
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {doneList.length} de {lessons.length} lecciones completadas
            </span>
            <Link className="btn btn-soft" href={`/evaluacion/${slug}`} style={{ fontSize: 12, padding: '6px 12px' }}>
              <Icon name="award" /> Evaluación
            </Link>
          </div>
        </header>

        {/* Contenido de la lección y notas */}
        <LessonReaderContent
          courseSlug={slug}
          lesson={currentLesson}
          lessonIndex={currentIndex >= 0 ? currentIndex : 0}
          totalLessons={lessons.length}
        />

        {/* Controles de navegación */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 28px 60px' }}>
          <LessonNavigation
            courseSlug={slug}
            lessonId={currentLesson.id}
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            isCompleted={isLessonDone}
            onToggleComplete={() => toggleLesson(slug, currentLesson.id)}
          />
        </div>

        {/* Footer del aula virtual */}
        <footer
          style={{
            borderTop: '1px solid #e2e8f0',
            padding: '20px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            color: '#64748b',
            background: '#ffffff',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 'auto',
          }}
        >
          <span>© {new Date().getFullYear()} EDDIP — Aula Virtual Oficial.</span>
          <a
            href="https://www.kytcode.lat"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Desarrollado por K&T <span style={{ color: '#0f172a' }}>♥</span>
          </a>
        </footer>
      </section>
    </div>
  );
}
