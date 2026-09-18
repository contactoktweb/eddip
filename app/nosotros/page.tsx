'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Icon } from '@/lib/icons';
import { contentService, defaultSiteContent, type SiteContent } from '@/lib/supabase/contentService';

export default function AboutPage() {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);

  useEffect(() => {
    let mounted = true;
    contentService.getSiteContent().then(res => {
      if (mounted) setContent(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO INSTITUCIONAL */}
        <section className="page-hero" style={{ padding: '72px 0 54px' }}>
          <div className="container" style={{ maxWidth: 880, textAlign: 'center' }}>
            <span className="eyebrow">{content.aboutHero.eyebrow}</span>
            <h1 style={{ fontSize: 38, lineHeight: 1.25, margin: '12px 0 18px', color: '#071F49' }}>
              {content.aboutHero.title}
            </h1>
            <p style={{ fontSize: 17, color: '#52637a', lineHeight: 1.6, margin: '0 auto', maxWidth: 760 }}>
              {content.aboutHero.description}
            </p>
          </div>
        </section>

        {/* MISIÓN Y VISIÓN */}
        <section className="section" style={{ paddingTop: 20 }}>
          <div className="container about-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <article
                className="panel"
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid var(--line)',
                  padding: 32,
                  boxShadow: '0 4px 20px rgba(7, 31, 73, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#eef4ff',
                      color: '#0F59DF',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon name="shield" size={22} />
                  </div>
                  <h2 style={{ fontSize: 22, margin: 0, color: '#071F49' }}>{content.mission.title}</h2>
                </div>
                <p style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.7, margin: '0 0 20px', fontWeight: 400 }}>
                  {content.mission.description}
                </p>

                <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, color: '#0F59DF', marginBottom: 12, fontWeight: 700 }}>
                  Pilares pedagógicos y doctrinarios:
                </h3>
                <div className="outcome-list" style={{ marginTop: 8 }}>
                  {content.mission.pillars.map((pillar, idx) => (
                    <div className="outcome-item" key={idx} style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 500, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Icon name="check" size={17} />
                      <span>{pillar}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article
                className="panel"
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid var(--line)',
                  padding: 32,
                  boxShadow: '0 4px 20px rgba(7, 31, 73, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon name="award" size={22} />
                  </div>
                  <h2 style={{ fontSize: 22, margin: 0, color: '#071F49' }}>{content.vision.title}</h2>
                </div>
                <p style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
                  {content.vision.description}
                </p>
              </article>
            </div>

            {/* Columna Visual Institucional */}
            <aside
              className="about-visual"
              style={{
                alignSelf: 'flex-start',
                position: 'sticky',
                top: 90,
                background: 'linear-gradient(145deg, #072559 0%, #0b50bc 50%, #0e6ae4 100%)',
                color: '#ffffff',
                borderRadius: 24,
                padding: '36px 32px',
                boxShadow: '0 25px 60px rgba(7, 31, 73, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}
            >
              <div
                className="about-logo"
                style={{
                  marginBottom: 20,
                  background: '#ffffff',
                  padding: 8,
                  borderRadius: 20,
                  display: 'inline-block',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.16)',
                  width: 'auto',
                  height: 'auto',
                }}
              >
                <Image src="/eddip-logo.png" alt="Escuela EDDIP" width={80} height={80} priority />
              </div>

              <strong style={{ fontSize: 26, letterSpacing: 0.5, color: '#ffffff', display: 'block', fontWeight: 800 }}>
                EDDIP
              </strong>
              <span
                style={{
                  fontSize: 12,
                  color: '#bfdbfe',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  display: 'block',
                  margin: '6px 0 16px',
                  fontWeight: 700,
                }}
              >
                Escuela de Desarrollo y Doctrina Policial
              </span>
              <p
                style={{
                  fontSize: 14.5,
                  color: '#f8fafc',
                  lineHeight: 1.65,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                Comprometidos con la modernización de los procesos de capacitación, la difusión de la doctrina policial y el fortalecimiento de las garantías constitucionales.
              </p>

              <div
                style={{
                  marginTop: 26,
                  paddingTop: 22,
                  borderTop: '1px solid rgba(255, 255, 255, 0.22)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.14)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    borderRadius: 14,
                    padding: '16px 10px',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: 26, color: '#ffffff', fontWeight: 800 }}>
                    {content.stats.students}
                  </strong>
                  <span style={{ fontSize: 12, color: '#e2e8f0', display: 'block', marginTop: 4, fontWeight: 500 }}>
                    Egresados
                  </span>
                </div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.14)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    borderRadius: 14,
                    padding: '16px 10px',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: 26, color: '#4ade80', fontWeight: 800 }}>
                    {content.stats.certificates}
                  </strong>
                  <span style={{ fontSize: 12, color: '#e2e8f0', display: 'block', marginTop: 4, fontWeight: 500 }}>
                    Certificados
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* VALIDEZ Y ACREDITACIÓN OFICIAL */}
        <section className="section soft" style={{ margin: '40px 0 0' }}>
          <div className="container" style={{ maxWidth: 860, textAlign: 'center' }}>
            <span className="eyebrow">Acreditación y Verificación</span>
            <h2 style={{ fontSize: 30, marginBottom: 12, color: '#071F49' }}>
              Certificaciones con respaldo institucional y consulta pública
            </h2>
            <p style={{ fontSize: 15, color: '#52637a', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: 640 }}>
              Cada participante que aprueba satisfactoriamente los módulos de formación y la prueba final de conocimientos recibe un diploma oficial dotado de código de registro alfanumérico único y código QR criptográfico para verificación inmediata ante entidades públicas y privadas.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" href="/cursos">
                Explorar oferta académica <Icon name="arrow" />
              </Link>
              <Link className="btn btn-outline" href="/certificados/validar">
                <Icon name="award" /> Validador público de certificados
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
