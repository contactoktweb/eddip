'use client';
import Link from 'next/link';
import Image from 'next/image';
import type { Course } from '@/lib/types';
import { allLessons } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { useDemo } from '@/app/providers';

type Props = {
  courses: Course[];
  completedMap: Record<string, string[]>;
};

export function StudentContinueLearning({ courses, completedMap }: Props) {
  const { results } = useDemo();

  if (courses.length === 0) {
    return (
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>Continúa aprendiendo</h2>
          <Link className="text-link" href="/cursos">
            Explorar catálogo
          </Link>
        </div>
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#f0f5ff',
              color: '#0F59DF',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="book" size={28} />
          </div>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Aún no tienes cursos inscritos</h3>
          <p style={{ fontSize: 13, color: '#68788d', maxWidth: 380, margin: '0 auto 18px' }}>
            Explora nuestro catálogo de programas certificados y comienza tu aprendizaje hoy.
          </p>
          <Link href="/cursos" className="btn btn-primary">
            Ver catálogo de cursos <Icon name="arrow" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="dash-card" aria-label="Cursos en progreso">
      <div className="dash-card-head">
        <h2>Continúa aprendiendo</h2>
        <Link className="text-link" href="/dashboard/cursos">
          Ver todos ({courses.length})
        </Link>
      </div>

      <div className="learning-list">
        {courses.slice(0, 3).map(course => {
          const lessons = allLessons(course);
          const doneLessons = completedMap[course.slug] || [];
          const pct = Math.round((doneLessons.length / Math.max(1, lessons.length)) * 100);
          const nextLesson = lessons.find(l => !doneLessons.includes(l.id)) || lessons[0];
          const isComplete = pct >= 100;
          const certResult = results[course.slug];
          const isCertified = !!certResult?.passed;

          return (
            <div className="learning-item" key={course.id}>
              <div
                className="learning-thumb"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 10,
                  background: course.gradient || 'linear-gradient(135deg, #0b62dd, #063f9b)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                }}
              >
                <Image
                  src={course.image || '/images/courses/seguridad.jpg'}
                  alt={course.title}
                  fill
                  sizes="62px"
                  style={{ objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(7, 21, 43, 0.45)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name={isCertified ? 'award' : isComplete ? 'check' : 'book'} size={18} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="cover-chip" style={{ fontSize: 10, padding: '2px 7px' }}>
                    {course.category}
                  </span>
                  {isCertified ? (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#059669',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Icon name="check" size={12} /> Certificado emitido
                    </span>
                  ) : isComplete ? (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#0F59DF',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Icon name="check" size={12} /> Lecciones listas
                    </span>
                  ) : null}
                </div>

                <h3 style={{ fontSize: 14, margin: '0 0 4px', fontWeight: 600 }}>{course.title}</h3>

                <div className="progress-row">
                  <div className="progress">
                    <span
                      style={{
                        width: `${pct}%`,
                        background: isCertified ? '#059669' : isComplete ? '#0F59DF' : undefined,
                      }}
                    ></span>
                  </div>
                  <span className="progress-label">{pct}%</span>
                </div>

                <div style={{ fontSize: 11, color: '#7a8b9e', marginTop: 4 }}>
                  {isCertified ? (
                    <span>Evaluación aprobada con éxito</span>
                  ) : isComplete ? (
                    <span>Todas las lecciones completadas · Presenta la evaluación</span>
                  ) : (
                    <span>Próxima: {nextLesson?.title || 'Evaluación'}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {isCertified ? (
                  <Link
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      borderColor: '#047857',
                      fontSize: 12,
                      padding: '8px 12px',
                    }}
                    href={certResult.code ? `/certificados/${certResult.code}` : '/dashboard/certificados'}
                  >
                    <Icon name="award" size={14} /> Ver certificado
                  </Link>
                ) : isComplete ? (
                  <Link
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #0F59DF, #073B9D)',
                      fontSize: 12,
                      padding: '8px 12px',
                    }}
                    href={`/evaluacion/${course.slug}`}
                  >
                    <Icon name="award" size={14} /> Evaluación
                  </Link>
                ) : (
                  <Link
                    className="btn btn-soft"
                    style={{ fontSize: 12, padding: '8px 12px' }}
                    href={`/aprender/${course.slug}/${nextLesson?.id || lessons[0]?.id}`}
                  >
                    Continuar
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
