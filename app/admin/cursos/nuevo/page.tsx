'use client';
import { CourseContentBuilder } from '@/components/admin/CourseContentBuilder';

export default function NewCoursePage() {
  return (
    <div className="dash-page">
      <header className="dash-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow">Editor de Contenidos</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Crear y cargar nuevo curso</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Configura la información general, portada, módulos temáticos y lecciones pedagógicas.
          </p>
        </div>
      </header>

      <CourseContentBuilder isEditing={false} />
    </div>
  );
}
