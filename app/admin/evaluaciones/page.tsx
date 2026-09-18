'use client';
import { useDemo } from '@/app/providers';
import { exams } from '@/lib/data';
import { AdminExamManager } from '@/components/admin/AdminExamManager';

export default function AdminExamsPage() {
  const { courses } = useDemo();

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Acreditación Académica</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Configuración de evaluaciones</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Diseña cuestionarios de opción múltiple, define el porcentaje aprobatorio y automatiza certificaciones.
          </p>
        </div>
      </header>

      <AdminExamManager courses={courses} exams={exams} />
    </div>
  );
}
