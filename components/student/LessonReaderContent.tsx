'use client';
import type { Lesson } from '@/lib/types';
import { LessonNotesWidget } from './LessonNotesWidget';

type Props = {
  courseSlug: string;
  lesson: Lesson;
  lessonIndex: number;
  totalLessons: number;
};

export function LessonReaderContent({
  courseSlug,
  lesson,
  lessonIndex,
  totalLessons,
}: Props) {
  return (
    <article className="reader-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="eyebrow" style={{ margin: 0 }}>
          Lección {lessonIndex + 1} de {totalLessons}
        </span>
        <span style={{ fontSize: 12, color: '#7a8b9e', background: '#f0f5fc', padding: '3px 9px', borderRadius: 6 }}>
          ⏱ {lesson.minutes} minutos de lectura
        </span>
      </div>

      <h1 style={{ fontSize: 32, marginBottom: 24, lineHeight: 1.25 }}>{lesson.title}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 16, lineHeight: 1.7, color: '#2d3748' }}>
        {lesson.content.map((paragraph, idx) => (
          <p key={idx} style={{ margin: 0 }}>
            {paragraph}
          </p>
        ))}
      </div>

      {lesson.keyPoint && (
        <div className="key-point" style={{ marginTop: 32 }}>
          <strong>Punto clave para el ejercicio profesional:</strong>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#2c4366' }}>{lesson.keyPoint}</p>
        </div>
      )}

      {/* Widget de notas de estudio sincronizadas con Supabase */}
      <LessonNotesWidget
        courseSlug={courseSlug}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
      />
    </article>
  );
}
