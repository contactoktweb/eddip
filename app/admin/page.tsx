'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { sales as initialSales, students as initialStudents } from '@/lib/data';
import { adminService } from '@/lib/supabase/adminService';
import type { Sale, Student } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { AdminStatGrid } from '@/components/admin/AdminStatGrid';
import { AdminMonthlyChart } from '@/components/admin/AdminMonthlyChart';
import { AdminPopularCourses } from '@/components/admin/AdminPopularCourses';
import { AdminRecentStudents } from '@/components/admin/AdminRecentStudents';

export default function AdminHomePage() {
  const { courses, certs } = useDemo();
  const [studentList, setStudentList] = useState<Student[]>(initialStudents);
  const [salesList, setSalesList] = useState<Sale[]>(initialSales);

  useEffect(() => {
    adminService.getAllStudents().then(res => {
      if (res && res.length > 0) {
        setStudentList(
          res.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            courses: s.coursesCount,
            progress: s.progressAvg,
            certificates: s.certificatesCount,
            registeredAt: s.registeredAt,
          }))
        );
      }
    });

    adminService.getSalesHistory().then(res => {
      if (res && res.length > 0) {
        setSalesList(res);
      }
    });
  }, []);

  const totalSales = salesList.reduce((a, b) => a + b.value, 0);

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
        totalStudents={studentList.length}
        totalCourses={courses.length}
        totalSales={totalSales}
        totalCertificates={certs.length}
      />

      {/* Gráfica y Cursos populares */}
      <div className="dash-grid">
        <AdminMonthlyChart totalSales={totalSales} salesCount={salesList.length} />
        <AdminPopularCourses courses={courses} />
      </div>

      {/* Últimos estudiantes registrados */}
      <AdminRecentStudents students={studentList} />
    </div>
  );
}
