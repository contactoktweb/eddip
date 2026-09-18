'use client';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { Icon } from '@/lib/icons';
import { StudentCourseList } from '@/components/student/StudentCourseList';

export default function StudentCoursesPage() {
  const { courses, purchased, completed, results } = useDemo();
  const ownedCourses = courses.filter(c => purchased.includes(c.slug));

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Biblioteca personal</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Mis cursos inscritos</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Accede al contenido completo, continúa tu avance lección a lección y presenta evaluaciones.
          </p>
        </div>

        <div className="dash-actions">
          <Link className="btn btn-primary" href="/cursos">
            <Icon name="plus" /> Agregar nuevo curso
          </Link>
        </div>
      </header>

      <StudentCourseList
        courses={ownedCourses}
        completedMap={completed}
        resultsMap={results}
      />
    </div>
  );
}
