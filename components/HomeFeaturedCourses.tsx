'use client';
import { useDemo } from '@/app/providers';
import { CourseCarousel } from './CourseCarousel';
import type { Course } from '@/lib/types';

type Props = {
  fallbackCourses: Course[];
};

export function HomeFeaturedCourses({ fallbackCourses }: Props) {
  const { courses } = useDemo();

  // Usar cursos del contexto o fallback
  const source = courses && courses.length > 0 ? courses : fallbackCourses;

  // Filtrar cursos destacados, o los primeros 6
  const featured = source.filter(c => c.featured);
  const displayCourses = featured.length > 0 ? featured : source.slice(0, 6);

  return <CourseCarousel courses={displayCourses} />;
}
