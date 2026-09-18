'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon } from '@/lib/icons';
import type { Course } from '@/lib/types';
import { allLessons } from '@/lib/data';

type Props = {
  course: Course;
  currentLessonId: string;
  completedLessons: string[];
  isOpen: boolean;
  onClose: () => void;
};

export function LessonSidebar({
  course,
  currentLessonId,
  completedLessons,
  isOpen,
  onClose,
}: Props) {
  const lessons = allLessons(course);
  const doneCount = completedLessons.length;
  const pct = Math.round((doneCount / Math.max(1, lessons.length)) * 100);

  // Módulos colapsables
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (modId: string) => {
    setCollapsedModules(prev => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  return (
    <>
      <aside className={`reader-side ${isOpen ? 'open' : ''}`} aria-label="Contenido del curso">
        <div className="reader-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <button
            type="button"
            className="icon-btn reader-mobile-toggle"
            onClick={onClose}
            aria-label="Cerrar índice"
            style={{ display: isOpen ? 'flex' : undefined }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="reader-course">
          <span className="cover-chip" style={{ fontSize: 10, marginBottom: 8, display: 'inline-block' }}>
            {course.category}
          </span>
          <h2 style={{ fontSize: 16, lineHeight: 1.3, marginBottom: 12 }}>{course.title}</h2>

          <div className="reader-progress">
            <div className="progress" style={{ marginBottom: 6 }}>
              <span style={{ width: `${pct}%` }}></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7a8b9e' }}>
              <span>{pct}% completado</span>
              <span>{doneCount}/{lessons.length} lecciones</span>
            </div>
          </div>
        </div>

        {/* Lista de módulos */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          {course.modules.map((mod, modIdx) => {
            const isCollapsed = !!collapsedModules[mod.id];
            const modLessonsDone = mod.lessons.filter(l => completedLessons.includes(l.id)).length;

            return (
              <div className="reader-module" key={mod.id}>
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'transparent',
                    border: 0,
                    padding: '6px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0, color: '#405269' }}>
                    Módulo {modIdx + 1}: {mod.title}
                  </h3>
                  <span style={{ fontSize: 11, color: '#8b9bb4', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {modLessonsDone}/{mod.lessons.length}
                    <Icon name={isCollapsed ? 'arrow' : 'close'} size={12} />
                  </span>
                </button>

                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                    {mod.lessons.map(l => {
                      const isDone = completedLessons.includes(l.id);
                      const isActive = l.id === currentLessonId;

                      return (
                        <Link
                          key={l.id}
                          href={`/aprender/${course.slug}/${l.id}`}
                          onClick={onClose}
                          className={`reader-lesson ${isActive ? 'active' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 10,
                            fontSize: 13,
                          }}
                        >
                          <span
                            className={`lesson-check ${isDone ? 'done' : ''}`}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              background: isDone ? '#059669' : '#eef3f8',
                              color: isDone ? '#fff' : '#8b9bb4',
                              flexShrink: 0,
                            }}
                          >
                            {isDone ? <Icon name="check" size={12} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b2c1d2' }}></span>}
                          </span>
                          <span style={{ flex: 1, lineHeight: 1.3 }}>{l.title}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.minutes}m</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Acceso a evaluación */}
        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <Link
            className="btn btn-outline btn-full"
            href={`/evaluacion/${course.slug}`}
            onClick={onClose}
            style={{ justifyContent: 'center' }}
          >
            <Icon name="award" /> Evaluación final
          </Link>
        </div>
      </aside>

      {isOpen && (
        <button
          className="sidebar-scrim"
          onClick={onClose}
          aria-label="Cerrar índice del curso"
        />
      )}
    </>
  );
}
