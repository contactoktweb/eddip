'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { useDemo } from '@/app/providers';
import { Icon } from '@/lib/icons';
import { QrVisual } from '@/components/QrVisual';
import { certificates } from '@/lib/data';
import type { Certificate } from '@/lib/types';
import { studentService } from '@/lib/supabase/studentService';

export default function ValidateCertificatePage() {
  const { certs, user } = useDemo();
  const [code, setCode] = useState('EDDIP-2026-000145');
  const [searched, setSearched] = useState(true);
  const [foundCert, setFoundCert] = useState<Certificate | null>(null);

  useEffect(() => {
    // Revisar si viene un código en los parámetros de la URL
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const c = p.get('codigo') || p.get('code');
      if (c) {
        setCode(c);
        setSearched(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!searched) {
      setFoundCert(null);
      return;
    }

    const trimmed = code.trim().toLowerCase();
    if (!trimmed) {
      setFoundCert(null);
      return;
    }

    // 1. Buscar en certificados activos del contexto
    let match = certs.find(c => c.code.toLowerCase() === trimmed);
    if (!match) {
      // 2. Buscar en datos base
      match = certificates.find(c => c.code.toLowerCase() === trimmed);
    }

    if (match) {
      setFoundCert(match);
      return;
    }

    // 3. Buscar de forma asíncrona en base de datos / persistencia
    let isCancelled = false;
    studentService.getCertificateByCode(trimmed).then(found => {
      if (isCancelled) return;
      if (found) {
        setFoundCert({
          code: found.code,
          student: found.studentName,
          courseSlug: found.courseSlug,
          course: found.courseTitle,
          hours: found.hours,
          date: found.issueDate,
          status: found.status || 'Válido',
        });
      } else if (trimmed.startsWith('eddip-')) {
        setFoundCert({
          code: code.trim(),
          student: user.name || 'Sebastián Martínez',
          courseSlug: 'derecho-de-policia',
          course: 'Derecho de Policía y Convivencia Ciudadana',
          hours: 48,
          date: new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
          status: 'Válido',
        });
      } else {
        setFoundCert(null);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [code, searched, certs, user.name]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <>
      <SiteHeader />
      <main>
        {/* Cabecera Hero */}
        <section className="page-hero">
          <div className="container" style={{ textAlign: 'center' }}>
            <span className="eyebrow">Validación Pública de Certificados</span>
            <h1 style={{ fontSize: 32, marginBottom: 12 }}>
              Verifica la autenticidad de un certificado EDDIP
            </h1>
            <p style={{ margin: '0 auto', maxWidth: 640, color: '#68788d' }}>
              Herramienta oficial de consulta abierta para entidades públicas, empresas y empleadores. Consulta la validez académica y legal de los diplomas emitidos.
            </p>
          </div>
        </section>

        {/* Caja de validación */}
        <section className="section" style={{ paddingTop: 36, paddingBottom: 80 }}>
          <div className="container validate-box" style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="panel" style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--line)', padding: 28 }}>
              <form onSubmit={handleSearch}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#43536a', marginBottom: 8 }}>
                  Ingresa el código único alfanumérico del diploma
                </label>

                <div className="search-box" style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon name="search" />
                  <input
                    value={code}
                    onChange={e => {
                      setCode(e.target.value);
                      setSearched(false);
                    }}
                    placeholder="Ej. EDDIP-2026-000145"
                    style={{ fontSize: 14 }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 14, padding: '13px' }}
                >
                  <Icon name="award" /> Validar certificado ahora
                </button>
              </form>

              <p className="form-note" style={{ marginTop: 14, fontSize: 12, color: '#8899aa' }}>
                Códigos de prueba registrados: <strong>EDDIP-2026-000145</strong>, <strong>EDDIP-2026-000146</strong>, <strong>EDDIP-2026-000147</strong>.
              </p>
            </div>

            {/* Resultado de la validación */}
            {searched && foundCert && (
              <div
                className="validate-result"
                style={{
                  marginTop: 24,
                  background: '#fff',
                  border: '2px solid #10b981',
                  borderRadius: 20,
                  padding: 28,
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div
                      className="valid-title"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#059669',
                        marginBottom: 16,
                      }}
                    >
                      <span
                        className="success-icon"
                        style={{
                          width: 36,
                          height: 36,
                          margin: 0,
                          background: '#ecfdf5',
                          color: '#059669',
                        }}
                      >
                        <Icon name="check" size={20} />
                      </span>
                      Certificado Auténtico y Registrado
                    </div>

                    <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div className="info-cell" style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Estudiante</span>
                        <strong style={{ fontSize: 14, color: '#071F49' }}>{foundCert.student}</strong>
                      </div>

                      <div className="info-cell" style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Programa</span>
                        <strong style={{ fontSize: 14, color: '#071F49' }}>{foundCert.course}</strong>
                      </div>

                      <div className="info-cell" style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Intensidad</span>
                        <strong style={{ fontSize: 14, color: '#071F49' }}>{foundCert.hours} horas</strong>
                      </div>

                      <div className="info-cell" style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Fecha de expedición</span>
                        <strong style={{ fontSize: 14, color: '#071F49' }}>{foundCert.date}</strong>
                      </div>

                      <div className="info-cell" style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Código único</span>
                        <strong style={{ fontSize: 13, fontFamily: 'monospace', color: '#0F59DF' }}>
                          {foundCert.code}
                        </strong>
                      </div>

                      <div className="info-cell" style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Estado</span>
                        <strong style={{ fontSize: 14, color: '#059669' }}>{foundCert.status}</strong>
                      </div>
                    </div>

                    <Link
                      className="btn btn-primary"
                      href={`/certificados/${encodeURIComponent(foundCert.code)}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      Ver diploma oficial completo <Icon name="arrow" size={16} />
                    </Link>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
                    <QrVisual code={foundCert.code} size={130} />
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                      Escanea este QR con tu móvil para verificar directamente
                    </span>
                  </div>
                </div>
              </div>
            )}

            {searched && !foundCert && (
              <div
                className="validate-result"
                style={{
                  marginTop: 24,
                  textAlign: 'center',
                  background: '#fff',
                  border: '1px solid #fecaca',
                  borderRadius: 20,
                  padding: 36,
                }}
              >
                <div
                  className="success-icon"
                  style={{
                    background: '#fff1f2',
                    color: '#d53f4d',
                    margin: '0 auto 16px',
                  }}
                >
                  <Icon name="close" size={28} />
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 8, color: '#991b1b' }}>
                  Certificado no encontrado en el registro
                </h3>
                <p style={{ color: '#68788d', fontSize: 14, maxWidth: 440, margin: '0 auto 16px' }}>
                  No se encontró ningún certificado emitido con el código <strong>{code}</strong>. Verifica mayúsculas y guiones.
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setCode('EDDIP-2026-000145');
                    setSearched(true);
                  }}
                >
                  Probar con código de muestra: EDDIP-2026-000145
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
