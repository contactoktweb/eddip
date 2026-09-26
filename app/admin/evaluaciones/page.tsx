'use client';
import { useEffect, useState, Suspense } from 'react';
import { useDemo } from '@/app/providers';
import { exams as initialExams } from '@/lib/data';
import { adminService } from '@/lib/supabase/adminService';
import { AdminExamManager } from '@/components/admin/AdminExamManager';
import type { Exam } from '@/lib/types';

export default function AdminExamsPage() {
  const { courses } = useDemo();
  const [examsList, setExamsList] = useState<Exam[]>(initialExams);

  useEffect(() => {
    adminService.getExams().then(loaded => {
      if (loaded && loaded.length > 0) {
        setExamsList(loaded);
      }
    });
  }, []);

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Acreditación Académica</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Configuración de evaluaciones</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Diseña cuestionarios de opción múltiple, define el número de preguntas, el porcentaje aprobatorio y sincroniza en tiempo real con las pruebas de los estudiantes.
          </p>
        </div>
      </header>

      <Suspense fallback={<div style={{ padding: 20 }}>Cargando editor de evaluaciones...</div>}>
        <AdminExamManager courses={courses} exams={examsList} />
      </Suspense>
    </div>
  );
}
