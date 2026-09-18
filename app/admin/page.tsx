'use client';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { sales, students } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { AdminStatGrid } from '@/components/admin/AdminStatGrid';
import { AdminMonthlyChart } from '@/components/admin/AdminMonthlyChart';
import { AdminPopularCourses } from '@/components/admin/AdminPopularCourses';
import { AdminRecentStudents } from '@/components/admin/AdminRecentStudents';

export default function AdminHomePage() {
  const { courses, certs } = useDemo();
  const totalSales = sales.reduce((a, b) => a + b.value, 0);

  return (
    <div className="dash-page">
      {/* Cabecera del panel */}
      <header className="dash-head">
        <div>
          <span className="eyebrow">Control Institucional</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Resumen de EDDIP</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Supervisión global de programas formativos, estudiantes, certificaciones y ventas.
          </p>
        </div>

        <div className="dash-actions">
          <Link className="btn btn-primary" href="/admin/cursos/nuevo">
            <Icon name="plus" /> Nuevo curso
          </Link>
        </div>
      </header>

      {/* Métricas clave */}
      <AdminStatGrid
        totalStudents={students.length + 720}
        totalCourses={courses.length}
        totalSales={totalSales}
        totalCertificates={certs.length + 180}
      />

      {/* Gráfica y Cursos populares */}
      <div className="dash-grid">
        <AdminMonthlyChart />
        <AdminPopularCourses courses={courses} />
      </div>

      {/* Últimos estudiantes registrados */}
      <AdminRecentStudents students={students} />
    </div>
  );
}
