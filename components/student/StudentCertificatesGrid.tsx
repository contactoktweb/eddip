'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/lib/icons';
import type { Certificate } from '@/lib/types';
import { useDemo } from '@/app/providers';

type Props = {
  certificates: Certificate[];
  studentName: string;
};

export function StudentCertificatesGrid({ certificates, studentName }: Props) {
  const router = useRouter();
  const { results } = useDemo();
  const [searchCode, setSearchCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filtrar los certificados del estudiante actual o que coincidan con su nombre / resultados
  const myCerts = certificates.filter(c => {
    if (!c) return false;
    const certStudent = (c.student || '').trim().toLowerCase();
    const currentStudent = (studentName || '').trim().toLowerCase();
    const isEarnedInResults = Object.values(results).some(
      r => r.passed && (r.code === c.code || r.code?.toLowerCase() === c.code.toLowerCase())
    );

    return (
      isEarnedInResults ||
      certStudent === currentStudent ||
      (currentStudent.includes('sebastián') && certStudent.includes('sebastián')) ||
      c.code.includes('DEMO') ||
      c.student === 'Estudiante EDDIP'
    );
  });

  const handleCopyLink = (code: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/certificados/${code}`;
      navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      router.push(`/certificados/${searchCode.trim()}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barra superior de validación rápida */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: 16, margin: '0 0 4px', fontWeight: 600 }}>
            Verificación y acreditación oficial
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Todos los certificados emitidos cuentan con código único verificable públicamente por instituciones.
          </p>
        </div>

        <form onSubmit={handleVerifySearch} style={{ display: 'flex', gap: 8, minWidth: 280 }}>
          <input
            type="text"
            placeholder="Ej. EDDIP-2026-000145"
            value={searchCode}
            onChange={e => setSearchCode(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              fontSize: 13,
              flex: 1,
            }}
          />
          <button type="submit" className="btn btn-outline" style={{ padding: '8px 14px', fontSize: 13 }}>
            Validar
          </button>
        </form>
      </div>

      {/* Lista de certificados */}
      {myCerts.length > 0 ? (
        <div className="cert-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {myCerts.map(cert => (
            <div
              className="cert-card"
              key={cert.code}
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  className="cert-card-icon"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#eef4ff',
                    color: '#0F59DF',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="award" size={24} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: cert.status === 'Válido' ? '#ecfdf5' : '#fff1f2',
                        color: cert.status === 'Válido' ? '#059669' : '#dc2626',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {cert.status}
                    </span>
                    <span style={{ fontSize: 11, color: '#8b9bb4', fontFamily: 'monospace' }}>
                      {cert.code}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, margin: '0 0 6px', lineHeight: 1.3 }}>{cert.course}</h3>
                  <div style={{ fontSize: 12, color: '#68788d' }}>
                    <span>{cert.date}</span> · <span>{cert.hours} horas académicas</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 12,
                  marginTop: 'auto',
                }}
              >
                <Link
                  className="btn btn-primary"
                  style={{ flex: 1, textAlign: 'center', justifyContent: 'center', fontSize: 13 }}
                  href={`/certificados/${cert.code}`}
                >
                  Ver certificado
                </Link>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleCopyLink(cert.code)}
                  title="Copiar enlace de validación"
                  style={{ fontSize: 13, padding: '0 12px' }}
                >
                  {copiedCode === cert.code ? (
                    <>
                      <Icon name="check" size={14} /> ¡Copiado!
                    </>
                  ) : (
                    'Copiar enlace'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="panel"
          style={{
            textAlign: 'center',
            padding: '56px 20px',
            background: '#fff',
            borderRadius: 18,
            border: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: '#eef4ff',
              color: '#0F59DF',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="award" size={32} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Aún no tienes certificados expedidos</h3>
          <p style={{ color: '#64748b', fontSize: 14, maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Completa todas las lecciones de tus cursos activos y presenta la evaluación final para obtener tu acreditación oficial con validez verificable.
          </p>
          <Link className="btn btn-primary" href="/dashboard/cursos">
            Ir a mis cursos <Icon name="arrow" />
          </Link>
        </div>
      )}
    </div>
  );
}
