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
                <p style={{ fontSize: 15, color: '#52637a', lineHeight: 1.65, margin: '0 0 20px' }}>
                  {content.mission.description}
                </p>

                <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: '#0F59DF', marginBottom: 12 }}>
                  Pilares pedagógicos y doctrinarios:
                </h3>
                <div className="outcome-list" style={{ marginTop: 8 }}>
                  {content.mission.pillars.map((pillar, idx) => (
                    <div className="outcome-item" key={idx} style={{ fontSize: 14 }}>
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
                <p style={{ fontSize: 15, color: '#52637a', lineHeight: 1.65, margin: 0 }}>
                  {content.vision.description}
                </p>
              </article>
            </div>

            {/* Columna Visual Institucional */}
            <aside className="about-visual" style={{ alignSelf: 'flex-start', position: 'sticky', top: 90 }}>
              <div className="about-logo" style={{ marginBottom: 16 }}>
                <Image src="/eddip-logo.png" alt="Escuela EDDIP" width={110} height={110} priority />
              </div>
              <strong style={{ fontSize: 24, letterSpacing: 0.5, color: '#071F49' }}>EDDIP</strong>
              <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', margin: '4px 0 14px' }}>
                Escuela de Desarrollo y Doctrina Policial
              </span>
              <p style={{ fontSize: 14, color: '#52637a', lineHeight: 1.6, margin: 0 }}>
                Comprometidos con la modernización de los procesos de capacitación, la difusión de la doctrina policial y el fortalecimiento de las garantías constitucionales.
              </p>

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: '1px solid var(--line)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  textAlign: 'center',
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: 20, color: '#0F59DF' }}>{content.stats.students}</strong>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Egresados</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 20, color: '#059669' }}>{content.stats.certificates}</strong>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Certificados</span>
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
