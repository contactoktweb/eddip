'use client';
import { StatCard } from '@/components/StatCard';
import { money } from '@/lib/data';

type Props = {
  totalStudents: number;
  totalCourses: number;
  totalSales: number;
  totalCertificates: number;
};

export function AdminStatGrid({
  totalStudents,
  totalCourses,
  totalSales,
  totalCertificates,
}: Props) {
  return (
    <section className="stats-grid" aria-label="Métricas del sistema">
      <StatCard
        label="Estudiantes registrados"
        value={totalStudents}
        icon="users"
        delta="Directorio activo"
      />
      <StatCard
        label="Cursos publicados"
        value={totalCourses}
        icon="book"
        delta="Oferta académica oficial"
      />
      <StatCard
        label="Ventas procesadas"
        value={money(totalSales)}
        icon="dollar"
        delta="Recaudo validado"
      />
      <StatCard
        label="Certificados expedidos"
        value={totalCertificates}
        icon="award"
        delta="Trazabilidad QR activa"
      />
    </section>
  );
}
