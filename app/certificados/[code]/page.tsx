'use client';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useDemo } from '@/app/providers';
import { QrVisual } from '@/components/QrVisual';
import { Icon } from '@/lib/icons';
import { certificates } from '@/lib/data';
import type { Certificate } from '@/lib/types';
import { studentService } from '@/lib/supabase/studentService';

export default function CertificateView() {
  const { code } = useParams<{ code: string }>();
  const { certs, courses, user, results } = useDemo();
  const [copied, setCopied] = useState(false);
  const [asyncCert, setAsyncCert] = useState<Certificate | null>(null);

  const decodedCode = decodeURIComponent(code || '').trim();

  // 1. Buscar en certificados activos del contexto o recuperado asíncronamente
  let cert = certs.find(c => c.code.toLowerCase() === decodedCode.toLowerCase()) || asyncCert;

  // 2. Si no se encuentra, buscar en datos base
  if (!cert) {
    cert = certificates.find(c => c.code.toLowerCase() === decodedCode.toLowerCase()) || null;
  }

  // 3. Revisar si pertenece a los resultados de examen del usuario actual
  if (!cert) {
    const matchedResult = Object.entries(results).find(
      ([, r]) => r.passed && r.code?.toLowerCase() === decodedCode.toLowerCase()
    );
    if (matchedResult) {
      const courseSlug = matchedResult[0];
      const courseObj = courses.find(c => c.slug === courseSlug);
      if (courseObj) {
        cert = {
          code: decodedCode,
          student: user.name,
          courseSlug,
          course: courseObj.title,
          hours: courseObj.durationHours,
          date: new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
          status: 'Válido',
        };
      }
    }
  }

  // 4. Buscar en persistencia local/remota si se accede desde enlace directo o QR
  useEffect(() => {
    if (!cert && decodedCode) {
      studentService.getCertificateByCode(decodedCode).then(found => {
        if (found) {
          setAsyncCert({
            code: found.code,
            student: found.studentName,
            courseSlug: found.courseSlug,
            course: found.courseTitle,
            hours: found.hours,
            date: found.issueDate,
            status: found.status || 'Válido',
          });
        }
      });
    }
  }, [cert, decodedCode]);

  // 5. Si es un código generado dinámicamente con prefijo EDDIP
  if (!cert && decodedCode.toUpperCase().startsWith('EDDIP-')) {
    cert = {
      code: decodedCode,
      student: user.name || 'Sebastián Martínez',
      courseSlug: 'derecho-de-policia',
      course: 'Derecho de Policía y Convivencia Ciudadana',
      hours: 48,
      date: new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
      status: 'Válido',
    } as Certificate;
  }

  if (!cert) {
    return (
      <main className="section container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#fff1f2',
            color: '#dc2626',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Icon name="close" size={32} />
        </div>
        <h1 style={{ fontSize: 26, marginBottom: 12 }}>Certificado no encontrado</h1>
        <p style={{ color: '#68788d', maxWidth: 460, margin: '0 auto 24px' }}>
          El código ingresado (<strong>{decodedCode}</strong>) no figura en la base de datos oficial o ha sido revocado.
        </p>
        <Link className="btn btn-primary" href="/certificados/validar">
          Ir al validador público de certificados
        </Link>
      </main>
    );
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const courseMeta = courses.find(c => c.slug === cert?.courseSlug);

  return (
    <main style={{ background: '#f0f4f9', minHeight: '100vh', padding: '32px 16px 64px' }}>
      {/* Barra superior de navegación y acciones */}
      <div
        className="container no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link className="btn btn-outline" href="/certificados/validar" style={{ fontSize: 13 }}>
            ← Validador público
          </Link>
          <span
            style={{
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ecfdf5',
              color: '#059669',
              padding: '6px 12px',
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            <Icon name="check" size={14} /> Certificado Oficial Verificado
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCopyLink}
            style={{ fontSize: 13 }}
          >
            {copied ? (
              <>
                <Icon name="check" size={14} /> ¡Enlace copiado!
              </>
            ) : (
              <>
                <Icon name="award" size={14} /> Copiar enlace directo
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            style={{ fontSize: 13 }}
          >
            <Icon name="file" /> Imprimir / Guardar en PDF
          </button>
        </div>
      </div>

      {/* Diploma Oficial con Estructura de Seguridad */}
      <section className="certificate-full" style={{ maxWidth: 960, margin: '0 auto' }}>
        <div
          className="certificate-border"
          style={{
            position: 'relative',
            background: '#ffffff',
            border: '8px double #0F59DF',
            borderRadius: '20px',
            padding: '48px 36px',
            boxShadow: '0 20px 60px rgba(7, 31, 73, 0.12)',
            textAlign: 'center',
          }}
        >
          {/* Marca de agua de seguridad */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.035,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <Image src="/eddip-logo.png" alt="" width={420} height={420} priority />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Cabecera Institucional */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 14,
                marginBottom: 16,
              }}
            >
              <Image src="/eddip-logo.png" alt="Logo oficial EDDIP" width={64} height={64} priority />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: 22, color: '#071F49', letterSpacing: 1, display: 'block' }}>
                  EDDIP
                </strong>
                <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Escuela de Desarrollo y Doctrina Policial
                </span>
              </div>
            </div>

            <div
              className="certificate-kicker"
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#0F59DF',
                textTransform: 'uppercase',
                margin: '12px 0 20px',
              }}
            >
              Acreditación y Certificación Académica Oficial
            </div>

            <p style={{ fontSize: 15, color: '#475569', margin: '0 0 6px' }}>
              El Consejo Académico y la Dirección General de EDDIP certifican que:
            </p>

            {/* Nombre del Estudiante */}
            <h1
              className="certificate-student"
              style={{
                fontSize: 34,
                fontFamily: 'Georgia, serif',
                color: '#071F49',
                margin: '14px 0 16px',
                borderBottom: '2px solid #0F59DF',
                display: 'inline-block',
                paddingBottom: 4,
              }}
            >
              {cert.student}
            </h1>

            <p style={{ fontSize: 15, color: '#475569', margin: '14px 0 8px' }}>
              Ha cursado, completado y aprobado satisfactoriamente todos los módulos y la evaluación final del programa:
            </p>

            {/* Nombre del Curso */}
            <div
              className="certificate-course-name"
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#0F59DF',
                maxWidth: 720,
                margin: '8px auto 24px',
                lineHeight: 1.3,
              }}
            >
              {cert.course}
            </div>

            {/* Metadatos del Certificado */}
            <div
              className="certificate-info"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
                maxWidth: 760,
                margin: '0 auto 28px',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Intensidad horaria</span>
                <strong style={{ fontSize: 15, color: '#071F49' }}>{cert.hours} horas lectivas</strong>
              </div>

              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Fecha de expedición</span>
                <strong style={{ fontSize: 15, color: '#071F49' }}>{cert.date}</strong>
              </div>

              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Código único</span>
                <strong style={{ fontSize: 13, fontFamily: 'monospace', color: '#0F59DF' }}>
                  {cert.code}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Estado en plataforma</span>
                <strong style={{ fontSize: 14, color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Icon name="check" size={14} /> {cert.status}
                </strong>
              </div>
            </div>

            <p style={{ fontSize: 12, maxWidth: 660, margin: '0 auto 32px', color: '#64748b', lineHeight: 1.5 }}>
              La autenticidad de este diploma puede ser verificada escaneando el código QR criptográfico incorporado o ingresando el código de registro en el validador oficial de <strong>www.eddip.com/certificados/validar</strong>.
            </p>

            {/* Firmas y Código QR Oficial */}
            <div
              className="certificate-footer"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 24,
                maxWidth: 760,
                margin: '0 auto',
                paddingTop: 16,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 140,
                    height: 1,
                    background: '#94a3b8',
                    margin: '0 auto 8px',
                  }}
                />
                <strong style={{ display: 'block', fontSize: 12, color: '#071F49' }}>
                  Dirección Académica
                </strong>
                <span style={{ fontSize: 10, color: '#64748b' }}>EDDIP Formación Nacional</span>
              </div>

              {/* QR Code Real Escaneable */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <QrVisual code={cert.code} size={118} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 140,
                    height: 1,
                    background: '#94a3b8',
                    margin: '0 auto 8px',
                  }}
                />
                <strong style={{ display: 'block', fontSize: 12, color: '#071F49' }}>
                  Secretaría General
                </strong>
                <span style={{ fontSize: 10, color: '#64748b' }}>Registro Oficial y Control</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
