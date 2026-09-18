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
        delta="+8.2% este mes"
      />
      <StatCard
        label="Cursos publicados"
        value={totalCourses}
        icon="book"
        delta="+2 este mes"
      />
      <StatCard
        label="Ventas procesadas"
        value={money(totalSales)}
        icon="dollar"
        delta="+12.4% vs mes anterior"
      />
      <StatCard
        label="Certificados expedidos"
        value={totalCertificates}
        icon="award"
        delta="+23 este mes"
      />
    </section>
  );
}
