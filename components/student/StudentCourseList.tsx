'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Course } from '@/lib/types';
import { allLessons } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { StudentCourseCard } from './StudentCourseCard';

type FilterTab = 'all' | 'in_progress' | 'completed';

type Props = {
  courses: Course[];
  completedMap: Record<string, string[]>;
  resultsMap?: Record<string, { score: number; passed: boolean; code?: string }>;
};

export function StudentCourseList({ courses, completedMap, resultsMap = {} }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // Búsqueda
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filtro de estado
      const lessons = allLessons(course);
      const doneCount = (completedMap[course.slug] || []).length;
      const pct = Math.round((doneCount / Math.max(1, lessons.length)) * 100);

      if (activeTab === 'completed') return pct >= 100;
      if (activeTab === 'in_progress') return pct < 100;
      return true;
    });
  }, [courses, completedMap, activeTab, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barra de control: Buscador y filtros */}
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
        {/* Tabs de filtro */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => setActiveTab('all')}
          >
            Todos ({courses.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'in_progress' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => setActiveTab('in_progress')}
          >
            En progreso
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => setActiveTab('completed')}
          >
            Completados
          </button>
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative', minWidth: 260, flex: '1 1 240px', maxWidth: 360 }}>
          <input
            type="search"
            placeholder="Buscar en mis cursos..."
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
            <Icon name="search" size={16} />
          </span>
        </div>
      </div>

      {/* Cuadrícula de cursos */}
      {filteredCourses.length > 0 ? (
        <div className="course-grid">
          {filteredCourses.map(c => (
            <StudentCourseCard
              key={c.id}
              course={c}
              completedLessons={completedMap[c.slug] || []}
              result={resultsMap[c.slug]}
            />
          ))}
        </div>
      ) : (
        <div
          className="panel"
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: '#fff',
            borderRadius: 18,
            border: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#f0f5ff',
              color: '#0F59DF',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="search" size={24} />
          </div>
          <h3 style={{ fontSize: 17, marginBottom: 8 }}>No se encontraron cursos</h3>
          <p style={{ color: '#68788d', fontSize: 14, maxWidth: 420, margin: '0 auto 20px' }}>
            {searchTerm
              ? `No encontramos resultados para "${searchTerm}". Prueba con otra palabra clave.`
              : 'No tienes cursos con el filtro seleccionado.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {searchTerm && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSearchTerm('')}
              >
                Limpiar búsqueda
              </button>
            )}
            <Link className="btn btn-primary" href="/cursos">
              Explorar catálogo completo <Icon name="arrow" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
