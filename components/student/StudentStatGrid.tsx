'use client';
import { StatCard } from '@/components/StatCard';

type StudentStatGridProps = {
  activeCourses: number;
  completedCourses: number;
  certificatesCount: number;
  studyHours: number;
};

export function StudentStatGrid({
  activeCourses,
  completedCourses,
  certificatesCount,
  studyHours,
}: StudentStatGridProps) {
  return (
    <section className="stats-grid" aria-label="Métricas del estudiante">
      <StatCard
        label="Cursos activos"
        value={activeCourses}
        icon="book"
      />
      <StatCard
        label="Cursos completados"
        value={completedCourses}
        icon="check"
      />
      <StatCard
        label="Certificados obtenidos"
        value={certificatesCount}
        icon="award"
      />
      <StatCard
        label="Horas de estudio"
        value={`${studyHours} h`}
        icon="clock"
      />
    </section>
  );
}
