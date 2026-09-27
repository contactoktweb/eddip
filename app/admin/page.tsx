'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/app/providers';
import { adminService, type EnrichedStudent } from '@/lib/supabase/adminService';
import type { Sale, Student } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { AdminStatGrid } from '@/components/admin/AdminStatGrid';
import { AdminMonthlyChart } from '@/components/admin/AdminMonthlyChart';
import { AdminPopularCourses } from '@/components/admin/AdminPopularCourses';
import { AdminRecentStudents } from '@/components/admin/AdminRecentStudents';

export default function AdminHomePage() {
  const router = useRouter();
  const { courses, certs, role } = useDemo();
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [salesList, setSalesList] = useState<Sale[]>([]);

  useEffect(() => {
    if (role === 'designer') {
      router.replace('/admin/cursos');
      return;
    }

    const loadStudents = () => {
      adminService.getAllStudents().then(res => {
        setStudentList(
          (res || []).map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            courses: s.coursesCount,
            progress: s.progressAvg,
            certificates: s.certificatesCount,
            registeredAt: s.registeredAt,
          }))
        );
      });
    };

    loadStudents();

    const loadSales = () => {
      adminService.getSalesHistory().then(res => {
        setSalesList(res || []);
      });
    };

    loadSales();

    const handleSalesUpdate = (e: Event) => {
      const custom = e as CustomEvent<Sale[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setSalesList(custom.detail);
      } else {
        loadSales();
      }
    };

    const handleStudentsUpdate = (e: Event) => {
      const custom = e as CustomEvent<EnrichedStudent[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setStudentList(
          custom.detail.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            courses: s.coursesCount,
            progress: s.progressAvg,
            certificates: s.certificatesCount,
            registeredAt: s.registeredAt,
          }))
        );
      } else {
        loadStudents();
      }
    };

    window.addEventListener('eddip_sales_updated', handleSalesUpdate);
    window.addEventListener('eddip_students_updated', handleStudentsUpdate);
    window.addEventListener('storage', handleSalesUpdate);
    window.addEventListener('storage', handleStudentsUpdate);

    return () => {
      window.removeEventListener('eddip_sales_updated', handleSalesUpdate);
      window.removeEventListener('eddip_students_updated', handleStudentsUpdate);
      window.removeEventListener('storage', handleSalesUpdate);
      window.removeEventListener('storage', handleStudentsUpdate);
    };
  }, []);

  const totalSales = salesList.filter(s => s.status === 'Aprobado').reduce((a, b) => a + b.value, 0);

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
