'use client';
import Link from 'next/link';
import type { Course } from '@/lib/types';
import { allLessons } from '@/lib/data';
import { Icon } from '@/lib/icons';

type Props = {
  course: Course;
  completedLessons: string[];
  result?: { score: number; passed: boolean; code?: string };
};

export function StudentCourseCard({ course, completedLessons, result }: Props) {
  const lessons = allLessons(course);
  const doneCount = completedLessons.length;
  const pct = Math.round((doneCount / Math.max(1, lessons.length)) * 100);
  const nextLesson = lessons.find(l => !completedLessons.includes(l.id)) || lessons[0];
  const isFinished = pct >= 100;
  const isCertified = !!result?.passed;

  return (
    <article className="course-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="course-cover" style={{ background: course.gradient, position: 'relative' }}>
        <span className="cover-chip">{course.category}</span>
        <div className="cover-art">
          <Icon name={isCertified ? 'award' : isFinished ? 'check' : 'book'} size={42} />
        </div>
        <span
          style={{
            position: 'absolute',
            bottom: 12,
            right: 14,
            background: 'rgba(7, 31, 73, 0.75)',
            color: '#fff',
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 6,
            backdropFilter: 'blur(4px)',
          }}
        >
          {course.durationHours} h lectivas
        </span>
      </div>

      <div className="course-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#7a8b9e', fontWeight: 500 }}>
            {course.modules.length} módulos · {lessons.length} lecciones
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isCertified ? '#059669' : isFinished ? '#0F59DF' : '#405269',
            }}
          >
            {isCertified ? '✓ Aprobado y Certificado' : isFinished ? '100% Lecciones listas' : `${pct}%`}
          </span>
        </div>

        <h3 style={{ fontSize: 16, marginBottom: 8, lineHeight: 1.3 }}>{course.title}</h3>
        <p style={{ fontSize: 13, color: '#68788d', flex: 1, marginBottom: 14 }}>
          {course.shortDescription}
        </p>

        <div className="progress-row" style={{ margin: '4px 0 16px' }}>
          <div className="progress">
            <span
              style={{
                width: `${pct}%`,
                background: isCertified ? '#059669' : isFinished ? '#0F59DF' : undefined,
              }}
            ></span>
          </div>
          <span className="progress-label">{doneCount}/{lessons.length}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
          {isCertified ? (
            <>
              <Link
                className="btn btn-primary"
                style={{
                  flex: '1 1 140px',
                  textAlign: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  borderColor: '#047857',
                  fontSize: 13,
                }}
                href={result?.code ? `/certificados/${result.code}` : '/dashboard/certificados'}
              >
                <Icon name="award" size={15} /> Ver certificado
              </Link>
              <Link
                className="btn btn-outline"
                style={{ padding: '0 12px', fontSize: 12, justifyContent: 'center' }}
                href={`/aprender/${course.slug}/${lessons[0]?.id}`}
                title="Repasar contenido"
              >
                Repasar
              </Link>
            </>
          ) : isFinished ? (
            <>
              <Link
                className="btn btn-primary"
                style={{
                  flex: '1 1 160px',
                  textAlign: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #0F59DF, #073B9D)',
                  fontSize: 13,
                }}
                href={`/evaluacion/${course.slug}`}
              >
                <Icon name="award" size={15} /> Presentar evaluación
              </Link>
              <Link
                className="btn btn-outline"
                style={{ padding: '0 12px', fontSize: 12, justifyContent: 'center' }}
                href={`/aprender/${course.slug}/${lessons[0]?.id}`}
              >
                Repasar
              </Link>
            </>
          ) : (
            <Link
              className="btn btn-primary"
              style={{ flex: 1, textAlign: 'center', justifyContent: 'center', fontSize: 13 }}
              href={`/aprender/${course.slug}/${nextLesson?.id || lessons[0]?.id}`}
            >
              {doneCount === 0 ? 'Iniciar curso' : 'Continuar lección'}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
