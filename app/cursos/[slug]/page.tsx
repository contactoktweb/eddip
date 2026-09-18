'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Icon } from '@/lib/icons';
import { money, allLessons } from '@/lib/data';
import { useDemo } from '@/app/providers';

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { courses, purchased } = useDemo();
  const course = courses.find(c => c.slug === slug);
  const [tab, setTab] = useState('descripcion');
  const [open, setOpen] = useState<string | null>(course?.modules[0]?.id || null);

  if (!course) {
    return (
      <>
        <SiteHeader />
        <div className="section container" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Curso no encontrado</h1>
          <p style={{ color: '#68788d', marginBottom: 20 }}>
            El programa que buscas no está disponible en la oferta formativa actual.
          </p>
          <Link className="btn btn-primary" href="/cursos">
            Volver al catálogo
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const isOwned = purchased.includes(course.slug);
  const lessons = allLessons(course);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="course-detail-hero">
          <div className="container course-detail-grid">
            <div>
              <span className="badge" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>
                {course.category}
              </span>
              <h1>{course.title}</h1>
              <p>{course.description}</p>
              <div className="detail-meta">
                <span>
                  <Icon name="star" size={17} /> {course.rating} · {course.students} estudiantes
                </span>
                <span>
                  <Icon name="clock" size={17} /> {course.durationHours} horas
                </span>
                <span>
                  <Icon name="book" size={17} /> {course.modules.length} módulos · {lessons.length} lecciones
                </span>
                <span>{course.level}</span>
              </div>
            </div>

            <aside className="enroll-card">
              <div className="enroll-cover" style={{ background: course.gradient }}>
                <Icon name="book" size={58} />
              </div>
              <div className="price">{money(course.price)}</div>
              <p style={{ fontSize: 12, color: '#5b6c81' }}>
                Acceso completo e ilimitado al contenido del curso, evaluación final y certificado oficial verificable.
              </p>
              <Link
                className="btn btn-primary btn-full btn-lg"
                href={isOwned ? `/aprender/${course.slug}/${lessons[0]?.id}` : `/checkout/${course.slug}`}
              >
                {isOwned ? 'Continuar curso' : 'Inscribirme en el curso'} <Icon name="arrow" />
              </Link>
              <ul>
                <li>
                  <Icon name="check" size={17} /> Acceso vitalicio desde tu dashboard
                </li>
                <li>
                  <Icon name="check" size={17} /> Seguimiento y avance por lección
                </li>
                <li>
                  <Icon name="check" size={17} /> Evaluación final de certificación
                </li>
                <li>
                  <Icon name="check" size={17} /> Diploma con validación QR oficial
                </li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="section">
          <div className="container detail-content">
            <div>
              <div className="detail-tabs">
                {[
                  ['descripcion', 'Descripción'],
                  ['contenido', 'Contenido temático'],
                  ['instructor', 'Equipo docente'],
                  ['faq', 'Preguntas frecuentes'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    className={tab === v ? 'active' : ''}
                    onClick={() => setTab(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {tab === 'descripcion' && (
                <>
                  <div className="content-block">
                    <h2>Sobre este curso</h2>
                    <p>{course.description}</p>
                  </div>
                  <div className="content-block">
                    <h2>Lo que aprenderás</h2>
                    <div className="outcome-list">
                      {course.outcomes.map(x => (
                        <div className="outcome-item" key={x}>
                          <Icon name="check" size={18} />
                          <span>{x}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {tab === 'contenido' && (
                <div className="content-block">
                  <h2>Contenido del curso</h2>
                  <p>
                    {course.modules.length} módulos · {lessons.length} lecciones estructuradas
                  </p>
                  <div className="accordion">
                    {course.modules.map(m => (
                      <div className="accordion-item" key={m.id}>
                        <button
                          className="accordion-head"
                          onClick={() => setOpen(open === m.id ? null : m.id)}
                        >
                          <span>{m.title}</span>
                          <span>{open === m.id ? '−' : '+'}</span>
                        </button>
                        {open === m.id && (
                          <div className="accordion-lessons">
                            {m.lessons.map(l => (
                              <div className="lesson-row" key={l.id}>
                                <span>○ {l.title}</span>
                                <span>{l.minutes} min</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'instructor' && (
                <div className="content-block">
                  <h2>Equipo docente</h2>
                  <div className="instructor-card">
                    <div className="instructor-row">
                      <div className="instructor-avatar">ED</div>
                      <div>
                        <strong>{course.instructor.name}</strong>
                        <div style={{ fontSize: 12, color: '#66758a' }}>{course.instructor.role}</div>
                      </div>
                    </div>
                    <p style={{ marginTop: 16 }}>{course.instructor.bio}</p>
                  </div>
                </div>
              )}

              {tab === 'faq' && (
                <div className="content-block">
                  <h2>Preguntas frecuentes</h2>
                  {[
                    [
                      '¿Puedo estudiar a mi propio ritmo?',
                      'Sí. Una vez matriculado, el contenido permanece habilitado en tu aula virtual las 24 horas para que avances según tu disponibilidad.',
                    ],
                    [
                      '¿Cómo funciona la evaluación final?',
                      'Al finalizar el recorrido temático de las lecciones, puedes presentar la prueba de conocimientos de selección múltiple con calificación inmediata.',
                    ],
                    [
                      '¿Cómo se valida la autenticidad del certificado?',
                      'Cada certificado cuenta con un código alfanumérico único registrado en la base oficial de EDDIP y un código QR verificable públicamente por empleadores e instituciones.',
                    ],
                  ].map(([q, a]) => (
                    <div className="instructor-card" style={{ marginBottom: 12 }} key={q}>
                      <strong>{q}</strong>
                      <p style={{ margin: '7px 0 0', fontSize: 13, color: '#4a5568' }}>{a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="side-note">
              <div className="category-icon">
                <Icon name="award" />
              </div>
              <h3>Certificación Oficial EDDIP</h3>
              <p style={{ fontSize: 12, color: '#4a5568' }}>
                Al aprobar la evaluación de certificación, se emite inmediatamente tu diploma oficial con trazabilidad institucional.
              </p>
              <Link className="text-link" href="/certificados/validar">
                Ver validador público <Icon name="arrow" size={16} />
              </Link>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
