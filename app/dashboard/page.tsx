'use client';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { allLessons } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { StudentStatGrid } from '@/components/student/StudentStatGrid';
import { StudentContinueLearning } from '@/components/student/StudentContinueLearning';
import { StudentRecentActivity } from '@/components/student/StudentRecentActivity';

export default function StudentDashboard() {
  const { user, courses, purchased, completed, certs, results } = useDemo();

  const owned = courses.filter(c => purchased.includes(c.slug));

  const getProgress = (slug: string) => {
    const c = courses.find(x => x.slug === slug);
    if (!c) return 0;
    const lessons = allLessons(c);
    const done = completed[slug]?.length || 0;
    return Math.round((done / Math.max(1, lessons.length)) * 100);
  };

  const finishedCount = owned.filter(c => getProgress(c.slug) >= 100).length;
  const totalCompletedLessons = Object.values(completed).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0
  );

  const totalStudyHours = owned.reduce((sum, c) => sum + c.durationHours, 0);
  const myCertificates = certs.filter(c => {
    const isEarned = Object.values(results).some(
      r => r.passed && (r.code === c.code || r.code?.toLowerCase() === c.code.toLowerCase())
    );
    return (
      isEarned ||
      c.student.toLowerCase() === user.name.toLowerCase() ||
      (user.name.toLowerCase().includes('sebastián') && c.student.toLowerCase().includes('sebastián'))
    );
  });

  return (
    <div className="dash-page">
      {/* Encabezado principal del panel */}
      <header className="dash-head">
        <div>
          <span className="eyebrow">Mi aula virtual</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>
            Hola, {user.name.split(' ')[0] || 'Estudiante'} 👋
          </h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Revisa tu progreso académico, continúa tus lecciones y accede a tus certificaciones.
          </p>
        </div>

        <div className="dash-actions">
          <Link className="btn btn-primary" href="/cursos">
            <Icon name="plus" /> Explorar cursos
          </Link>
        </div>
      </header>

      {/* Métricas del estudiante */}
      <StudentStatGrid
        activeCourses={owned.length}
        completedCourses={finishedCount}
        certificatesCount={myCertificates.length}
        studyHours={totalStudyHours}
      />

      {/* Cuadrícula de contenido principal */}
      <div className="dash-grid">
        <StudentContinueLearning courses={owned} completedMap={completed} />
        <StudentRecentActivity
          certificatesCount={myCertificates.length}
          completedLessonsCount={totalCompletedLessons}
        />
      </div>
    </div>
  );
}
