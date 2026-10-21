'use client';
import Link from 'next/link';
import type { Course } from '@/lib/types';
import { Icon } from '@/lib/icons';

type Props = {
  courses: Course[];
  /** Estudiantes matriculados por slug de curso, calculado desde el directorio real. */
  enrollmentCounts: Record<string, number>;
};

const TOP_COURSES_LIMIT = 5;

export function AdminPopularCourses({ courses, enrollmentCounts }: Props) {
  const enrolled = (course: Course) => enrollmentCounts[course.slug] || 0;
  const sorted = courses
    .slice()
    .sort((a, b) => enrolled(b) - enrolled(a) || a.title.localeCompare(b.title))
    .slice(0, TOP_COURSES_LIMIT);

  return (
    <aside className="dash-card" aria-label="Cursos más populares">
      <div className="dash-card-head">
        <h2>Cursos más solicitados</h2>
        <Link className="text-link" href="/admin/cursos" style={{ fontSize: 12 }}>
          Ver catálogo
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((course, index) => (
          <div
            key={course.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 10,
              background: '#fbfcfd',
              border: '1px solid #f1f5f9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                className="avatar"
                style={{
                  width: 30,
                  height: 30,
                  fontSize: 11,
                  borderRadius: 8,
                  background: index === 0 ? '#0F59DF' : '#e2e8f0',
                  color: index === 0 ? '#fff' : '#475569',
                  flexShrink: 0,
                }}
              >
                #{index + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {course.title}
                </strong>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {course.category} · {enrolled(course)} {enrolled(course) === 1 ? 'matriculado' : 'matriculados'}
                </span>
              </div>
            </div>

            <Link
              href={`/cursos/${course.slug}`}
              className="icon-btn"
              title="Ver curso en catálogo"
              aria-label={`Ver ${course.title} en el catálogo`}
              target="_blank"
            >
              <Icon name="search" size={14} />
            </Link>
          </div>
        ))}
      </div>
    </aside>
  );
}
