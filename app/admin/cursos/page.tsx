'use client';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { Icon } from '@/lib/icons';
import { AdminCourseTable } from '@/components/admin/AdminCourseTable';

export default function AdminCoursesPage() {
  const { courses, deleteCourse } = useDemo();

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Oferta Académica</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Gestión de cursos y contenidos</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Administra los programas formativos, edita lecciones, módulos y publica nueva oferta educativa.
          </p>
        </div>

        <div className="dash-actions">
          <Link className="btn btn-primary" href="/admin/cursos/nuevo">
            <Icon name="plus" /> Nuevo curso
          </Link>
        </div>
      </header>

      <AdminCourseTable courses={courses} onDeleteCourse={deleteCourse} />
    </div>
  );
}
