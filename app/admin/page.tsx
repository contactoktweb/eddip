'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/app/providers';
import { adminService, type EnrichedStudent } from '@/lib/supabase/adminService';
import { contentService } from '@/lib/supabase/contentService';
import { certificates as seedCertificates } from '@/lib/data';
import type { Sale } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { AdminStatGrid } from '@/components/admin/AdminStatGrid';
import { AdminMonthlyChart } from '@/components/admin/AdminMonthlyChart';
import { AdminPopularCourses } from '@/components/admin/AdminPopularCourses';
import { AdminRecentStudents } from '@/components/admin/AdminRecentStudents';

export default function AdminHomePage() {
  const router = useRouter();
  const { courses, role } = useDemo();
  const [studentList, setStudentList] = useState<EnrichedStudent[]>([]);
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [certificatesCount, setCertificatesCount] = useState(0);

  useEffect(() => {
    if (role === 'designer') {
      router.replace('/admin/cursos');
      return;
    }

    const loadStudents = () => {
      adminService.getAllStudents().then(res => setStudentList(res || []));
    };

    loadStudents();

    // Se excluyen los certificados de ejemplo incluidos en la semilla inicial del proyecto
    const seedCodes = new Set(seedCertificates.map(c => c.code.toLowerCase()));
    contentService.getCertificates().then(list => {
      setCertificatesCount(list.filter(c => !seedCodes.has(c.code.toLowerCase())).length);
    });

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
        setStudentList(custom.detail);
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

  const enrollmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const student of studentList) {
      for (const enrollment of student.enrolledCourses || []) {
        counts[enrollment.slug] = (counts[enrollment.slug] || 0) + 1;
      }
    }
    return counts;
  }, [studentList]);

  const recentStudents = useMemo(
    () =>
      studentList
        .slice()
        .sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''))
        .map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          courses: s.coursesCount,
          progress: s.progressAvg,
          certificates: s.certificatesCount,
          registeredAt: s.registeredAt,
        })),
    [studentList]
  );

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
        totalCertificates={certificatesCount}
      />

      {/* Gráfica y Cursos populares */}
      <div className="dash-grid">
        <AdminMonthlyChart sales={salesList} />
        <AdminPopularCourses courses={courses} enrollmentCounts={enrollmentCounts} />
      </div>

      {/* Últimos estudiantes registrados */}
      <AdminRecentStudents students={recentStudents} />
    </div>
  );
}
