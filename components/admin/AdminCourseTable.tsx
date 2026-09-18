'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Course } from '@/lib/types';
import { money, allLessons } from '@/lib/data';
import { Icon } from '@/lib/icons';

type Props = {
  courses: Course[];
  onDeleteCourse?: (slug: string) => void;
};

export function AdminCourseTable({ courses, onDeleteCourse }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const categories = useMemo(() => {
    const list = Array.from(new Set(courses.map(c => c.category)));
    return ['Todas', ...list];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = categoryFilter === 'Todas' || course.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [courses, searchTerm, categoryFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controles de catálogo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          background: '#fff',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 260, maxWidth: 380, flex: 1 }}>
            <input
              type="search"
              placeholder="Buscar curso por título..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                fontSize: 13,
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8b9bb4',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name="search" size={15} />
            </span>
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              fontSize: 13,
              background: '#fff',
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'Todas' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>
        </div>

        <Link className="btn btn-primary" href="/admin/cursos/nuevo">
          <Icon name="plus" /> Nuevo curso
        </Link>
      </div>

      {/* Tabla de cursos */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Programa formativo</th>
              <th>Categoría</th>
              <th>Módulos / Lecciones</th>
              <th>Estudiantes</th>
              <th>Precio</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map(course => {
              const lessons = allLessons(course);

              return (
                <tr key={course.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: course.gradient,
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="book" size={18} />
                      </div>
                      <div>
                        <div className="table-title">{course.title}</div>
                        <small style={{ color: '#7a8b9e' }}>
                          {course.durationHours} horas · Nivel {course.level}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cover-chip" style={{ fontSize: 11 }}>
                      {course.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13 }}>
                      {course.modules.length} mód · {lessons.length} lecc.
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 13, color: '#071F49' }}>{course.students}</strong>
                      <span style={{ fontSize: 11, color: '#7a8b9e' }}>
                        {course.students === 1 ? 'estudiante' : 'estudiantes'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: 13, color: '#0F59DF' }}>
                      {money(course.price)}
                    </strong>
                  </td>
                  <td>
                    <span className="badge status-ok">Publicado</span>
                  </td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <Link
                        className="icon-btn"
                        href={`/cursos/${course.slug}`}
                        title="Ver en catálogo público"
                        target="_blank"
                      >
                        <Icon name="search" size={15} />
                      </Link>
                      <Link
                        className="icon-btn"
                        href={`/admin/cursos/${course.slug}`}
                        title="Editar curso y lecciones"
                      >
                        <Icon name="edit" size={15} />
                      </Link>
                      {onDeleteCourse && (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Eliminar curso"
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar el curso "${course.title}"?`)) {
                              onDeleteCourse(course.slug);
                            }
                          }}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
