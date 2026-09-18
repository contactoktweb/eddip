'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { CourseContentBuilder } from '@/components/admin/CourseContentBuilder';

export default function EditCoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const { courses } = useDemo();

  const course = courses.find(c => c.slug === slug);

  if (!course) {
    return (
      <div className="dash-page" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: 26, marginBottom: 12 }}>Curso no encontrado</h1>
        <p style={{ color: '#68788d', marginBottom: 20 }}>
          El programa formativo que intentas editar no existe o ha sido modificado.
        </p>
        <Link className="btn btn-primary" href="/admin/cursos">
          Volver al catálogo de cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <header className="dash-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow">Editor de Contenidos</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Editar: {course.title}</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Modifica información del curso, ajusta lecciones, añade módulos o actualiza resultados.
          </p>
        </div>
      </header>

      <CourseContentBuilder initialCourse={course} isEditing={true} />
    </div>
  );
}
