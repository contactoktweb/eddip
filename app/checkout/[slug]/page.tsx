'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { useDemo } from '@/app/providers';
import { money } from '@/lib/data';
import { Icon } from '@/lib/icons';

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { courses, purchase, login, user } = useDemo();
  const course = courses.find(c => c.slug === slug);
  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');

  if (!course) {
    return (
      <div className="section container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Curso no encontrado</h1>
        <Link className="btn btn-primary" href="/cursos">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const pay = () => {
    setStage('processing');
    setTimeout(() => {
      purchase(course.slug);
      login('student');
      setStage('success');
    }, 1200);
  };

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="checkout-head">
          <Logo />
          <Link className="text-link" href={`/cursos/${course.slug}`}>
            ← Volver al curso
          </Link>
        </div>

        {stage === 'success' ? (
          <div className="panel" style={{ maxWidth: 620, margin: '60px auto', textAlign: 'center', padding: '40px 28px' }}>
            <div className="processing">
              <div
                className="success-icon"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Icon name="check" size={34} />
              </div>
              <h2 style={{ fontSize: 24, marginBottom: 8 }}>¡Inscripción confirmada con éxito!</h2>
              <p style={{ color: '#5b6c81', fontSize: 14, margin: '0 auto 24px', maxWidth: 460 }}>
                Tu matrícula en <strong>{course.title}</strong> ha sido procesada y activada inmediatamente en tu aula virtual de EDDIP.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => router.push('/dashboard/cursos')}
                style={{ padding: '12px 28px' }}
              >
                Ir a mis cursos <Icon name="arrow" />
              </button>
            </div>
          </div>
        ) : stage === 'processing' ? (
          <div className="panel" style={{ maxWidth: 620, margin: '60px auto', textAlign: 'center', padding: '50px 28px' }}>
            <div className="processing">
              <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
              <h2 style={{ fontSize: 22, marginBottom: 8 }}>Confirmando inscripción...</h2>
              <p style={{ color: '#68788d', fontSize: 14 }}>
                Verificando la transacción y habilitando los permisos en tu aula virtual.
              </p>
            </div>
          </div>
        ) : (
          <div className="checkout-grid">
            <section className="panel" style={{ padding: 28 }}>
              <span className="eyebrow">Matrícula Académica</span>
              <h2 style={{ fontSize: 22, marginBottom: 18 }}>Datos del estudiante</h2>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label>Nombre y apellidos</label>
                  <input defaultValue={user.name || 'Sebastián Martínez'} />
                </div>
                <div className="field">
                  <label>Cédula o Documento de identidad</label>
                  <input defaultValue={user.documentId || '1.032.456.789'} />
                </div>
              </div>

              <div className="field">
                <label>Correo electrónico institucional o personal</label>
                <input defaultValue={user.email || 'estudiante@correo.com'} />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label>Teléfono / Móvil</label>
                  <input defaultValue={user.phone || '300 555 0182'} />
                </div>
                <div className="field">
                  <label>Ciudad de residencia</label>
                  <input defaultValue={user.city || 'Bogotá D.C.'} />
                </div>
              </div>

              <h3 style={{ marginTop: 24, fontSize: 16 }}>Método de pago habilitado</h3>
              <div
                className="payment-logo"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  background: '#f8fafc',
                }}
              >
                <div
                  className="payment-dot"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#0F59DF',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                  }}
                >
                  P
                </div>
                <div>
                  <strong style={{ fontSize: 14 }}>PSE / Tarjeta Débito y Crédito</strong>
                  <div style={{ fontSize: 11, color: '#66758a' }}>
                    Pasarela en línea segura con validación instantánea
                  </div>
                </div>
                <span
                  className="badge"
                  style={{
                    marginLeft: 'auto',
                    background: '#ecfdf5',
                    color: '#059669',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  Oficial
                </span>
              </div>
              <p className="form-note" style={{ fontSize: 11, color: '#8899aa', marginTop: 10 }}>
                Tus datos personales están protegidos conforme a la política institucional de tratamiento de datos de EDDIP.
              </p>
            </section>

            <aside className="panel order-summary" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>Resumen de matrícula</h2>
              <div className="order-course" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div
                  className="order-thumb"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: course.gradient,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <strong style={{ fontSize: 14, display: 'block', lineHeight: 1.3 }}>{course.title}</strong>
                  <div style={{ fontSize: 12, color: '#66758a', marginTop: 3 }}>
                    {course.durationHours} horas · {course.level}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 22, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                <div className="summary-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span>Valor de matrícula</span>
                  <strong>{money(course.price)}</strong>
                </div>
                <div className="summary-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#059669' }}>
                  <span>Descuento institucional</span>
                  <span>$0</span>
                </div>
                <div
                  className="summary-line summary-total"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#071F49',
                    borderTop: '1px solid var(--line)',
                    paddingTop: 10,
                    marginTop: 6,
                  }}
                >
                  <span>Total a cancelar</span>
                  <strong>{money(course.price)}</strong>
                </div>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: 20, padding: '13px', justifyContent: 'center' }}
                onClick={pay}
              >
                Confirmar e Inscribirme <Icon name="check" />
              </button>

              <div className="hero-trust" style={{ marginTop: 18, display: 'grid', gap: 8, fontSize: 12, color: '#5b6c81' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="shield" size={15} /> Pago seguro con cifrado bancario SSL 256-bit
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="check" size={15} /> Activación inmediata en tu aula virtual
                </span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
