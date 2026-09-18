'use client';
import Link from 'next/link';
import type { Lesson } from '@/lib/types';
import { Icon } from '@/lib/icons';

type Props = {
  courseSlug: string;
  lessonId: string;
  prevLesson?: Lesson;
  nextLesson?: Lesson;
  isCompleted: boolean;
  onToggleComplete: () => void;
};

export function LessonNavigation({
  courseSlug,
  lessonId,
  prevLesson,
  nextLesson,
  isCompleted,
  onToggleComplete,
}: Props) {
  return (
    <nav className="reader-nav" aria-label="Navegación entre lecciones" style={{ marginTop: 32 }}>
      <div>
        {prevLesson ? (
          <Link
            className="btn btn-outline"
            href={`/aprender/${courseSlug}/${prevLesson.id}`}
            style={{ fontSize: 13 }}
          >
            ← Anterior: {prevLesson.title.length > 25 ? prevLesson.title.slice(0, 25) + '...' : prevLesson.title}
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div>
        <button
          type="button"
          className={isCompleted ? 'btn btn-soft' : 'btn btn-primary'}
          onClick={onToggleComplete}
          style={{
            minWidth: 200,
            justifyContent: 'center',
            borderColor: isCompleted ? '#bbf7d0' : undefined,
            color: isCompleted ? '#059669' : undefined,
            background: isCompleted ? '#ecfdf5' : undefined,
          }}
        >
          {isCompleted ? (
            <>
              <Icon name="check" size={16} /> Lección completada
            </>
          ) : (
            <>
              <Icon name="check" size={16} /> Marcar como completada
            </>
          )}
        </button>
      </div>

      <div>
        {nextLesson ? (
          <Link
            className="btn btn-primary"
            href={`/aprender/${courseSlug}/${nextLesson.id}`}
            style={{ fontSize: 13 }}
          >
            Siguiente: {nextLesson.title.length > 25 ? nextLesson.title.slice(0, 25) + '...' : nextLesson.title} →
          </Link>
        ) : (
          <Link
            className="btn btn-primary"
            href={`/evaluacion/${courseSlug}`}
            style={{
              background: 'linear-gradient(135deg, #0F59DF, #073B9D)',
              boxShadow: '0 4px 14px rgba(15, 89, 223, 0.35)',
              fontSize: 13,
            }}
          >
            Presentar evaluación final <Icon name="award" />
          </Link>
        )}
      </div>
    </nav>
  );
}
