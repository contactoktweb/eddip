'use client';
import type { Course } from '@/lib/types';
import { money } from '@/lib/data';

type Props = {
  courses: Course[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  /** Cursos que ya tiene la persona: se muestran deshabilitados. */
  disabledSlugs?: string[];
  idPrefix: string;
};

export function CourseMultiSelect({ courses, selected, onChange, disabledSlugs = [], idPrefix }: Props) {
  const toggle = (slug: string) =>
    onChange(selected.includes(slug) ? selected.filter(s => s !== slug) : [...selected, slug]);

  if (courses.length === 0) {
    return <p className="field-hint">No hay cursos publicados para asignar.</p>;
  }

  return (
    <ul className="course-multiselect" role="group" aria-label="Cursos disponibles">
      {courses.map(course => {
        const owned = disabledSlugs.includes(course.slug);
        const id = `${idPrefix}-${course.slug}`;
        return (
          <li key={course.slug}>
            <label htmlFor={id} className={`course-multiselect-item ${owned ? 'is-owned' : ''}`}>
              <input
                id={id}
                type="checkbox"
                checked={owned || selected.includes(course.slug)}
                disabled={owned}
                onChange={() => toggle(course.slug)}
              />
              <span className="course-multiselect-text">
                <strong>{course.title}</strong>
                <small>
                  {owned ? 'Ya matriculado' : `${course.durationHours} h · ${money(course.price)}`}
                </small>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
