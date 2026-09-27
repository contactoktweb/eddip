'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/lib/icons';
import { QrVisual } from '@/components/QrVisual';
import {
  contentService,
  defaultHomeHero,
  type HomeHeroContent,
} from '@/lib/supabase/contentService';

type Props = {
  initialHero?: HomeHeroContent;
};

export function HomeHeroSection({ initialHero = defaultHomeHero }: Props) {
  const [hero, setHero] = useState<HomeHeroContent>(initialHero);

  useEffect(() => {
    let mounted = true;
    contentService.getSiteContent().then(res => {
      if (mounted && res?.homeHero) {
        setHero(res.homeHero);
      }
    });

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (!mounted) return;
      if (custom.detail?.homeHero) {
        setHero(custom.detail.homeHero);
      } else if (custom.detail?.key === 'homeHero' && custom.detail?.value) {
        setHero(custom.detail.value);
      } else {
        contentService.getSiteContent().then(res => {
          if (mounted && res?.homeHero) setHero(res.homeHero);
        });
      }
    };

    window.addEventListener('eddip_site_content_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('eddip_site_content_updated', handleUpdate);
    };
  }, []);

  // Formatear titular con fragmento resaltado
  const renderHeadline = () => {
    const text = hero.headline || defaultHomeHero.headline;
    const highlight = hero.headlineHighlight || defaultHomeHero.headlineHighlight;

    if (!highlight || !text.includes(highlight)) {
      return text;
    }

    const parts = text.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="hero-highlight">{highlight}</span>
        {parts.slice(1).join(highlight)}
      </>
    );
  };

  return (
    <section className="premium-hero" aria-label="Introducción a la plataforma EDDIP">
      <div className="hero-shape hero-shape-a" aria-hidden="true" />
      <div className="hero-shape hero-shape-b" aria-hidden="true" />
      <div className="hero-dot-grid" aria-hidden="true" />

      <div className="container premium-hero-grid">
        {/* Left Copy Column */}
        <div className="premium-hero-copy">
          <span className="hero-badge">
            <Icon name="cap" size={14} />
            <span>{hero.eyebrow || 'Bienvenido a EDDIP'}</span>
          </span>

          <h1 className="hero-headline">{renderHeadline()}</h1>

          <p className="hero-lead">
            {hero.lead ||
              'Capacítate con cursos especializados diseñados por expertos. Aprende a tu ritmo, obtén certificados verificables y avanza en tu carrera profesional.'}
          </p>

          <div className="hero-actions">
            <Link className="btn hero-btn-light" href={hero.primaryBtnLink || '/cursos'}>
              <span>{hero.primaryBtnText || 'Explorar cursos'}</span>
              <span className="btn-orb light">
                <Icon name="arrow" size={14} />
              </span>
            </Link>

            <Link className="btn hero-btn-ghost" href={hero.secondaryBtnLink || '/nosotros'}>
              <span>{hero.secondaryBtnText || 'Conoce más'}</span>
              <Icon name="play" size={16} />
            </Link>
          </div>

          <div className="hero-benefits">
            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <Icon name="award" size={16} />
              </div>
              <span>
                Certificados
                <br />
                verificables
              </span>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <Icon name="refresh" size={16} />
              </div>
              <span>
                Contenido
                <br />
                actualizado
              </span>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <Icon name="play" size={16} />
              </div>
              <span>
                Aprende
                <br />a tu ritmo
              </span>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <Icon name="headset" size={16} />
              </div>
              <span>
                Soporte
                <br />
                especializado
              </span>
            </div>
          </div>
        </div>

        {/* Right Visual Composition */}
        <div className="hero-visual-wrapper" aria-label="Estudiante interactuando con la plataforma EDDIP">
          <div className="hero-glow-backdrop" aria-hidden="true" />
          <div className="hero-backdrop-circle" aria-hidden="true" />

          {/* Main Student Photo */}
          <div className="hero-student-frame">
            <Image
              src="/images/hero-student.jpg"
              alt="Estudiante profesional aprendiendo en la plataforma EDDIP"
              width={520}
              height={520}
              priority
              className="hero-student-image"
            />
          </div>

          {/* 1. Progress Card (Top Left) */}
          <div className="floating-card float-progress" aria-label="Progreso del estudiante">
            <span className="float-label">Mi progreso</span>
            <div className="progress-flex">
              <div className="donut-chart-wrap" aria-label="75% completado">
                <svg viewBox="0 0 36 36" className="donut-svg">
                  <path
                    className="donut-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="donut-fill"
                    strokeDasharray="75, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="donut-text">75%</span>
              </div>
              <div className="donut-info">
                <strong>18 de 12 cursos</strong>
                <small>completados</small>
                <Link href="/dashboard" className="float-link">
                  Ver detalles →
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Verified Certificate Card (Top Right) */}
          <div className="floating-card float-verified" aria-label="Certificado verificado">
            <div className="verified-icon-circle">
              <Icon name="check" size={14} />
            </div>
            <div className="verified-body">
              <span className="verified-title">Certificado oficial</span>
              <small className="verified-code">Código: EDDIP-2026-000145</small>
              <span className="verified-pill">Válido</span>
            </div>
          </div>

          {/* 3. Recent Activity Card (Middle Left) */}
          <div className="floating-card float-activity" aria-label="Actividad reciente">
            <div className="activity-top">
              <span className="float-label">Actividad reciente</span>
              <span className="activity-gain">+28%</span>
            </div>
            <div className="sparkline-wrap" aria-hidden="true">
              <svg viewBox="0 0 120 34" className="sparkline-svg">
                <path
                  d="M0,28 Q18,24 32,12 T64,18 T96,6 T120,10"
                  fill="none"
                  stroke="#2F86FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="96" cy="6" r="3.5" fill="#2F86FF" />
              </svg>
            </div>
            <small className="activity-period">Últimos 7 días</small>
          </div>

          {/* 4. Enrolled Course Card (Bottom Right) */}
          <div className="floating-card float-enrolled" aria-label="Curso inscrito">
            <div className="enrolled-thumb">
              <Image
                src="/images/courses/seguridad.jpg"
                alt="Investigación Criminal Aplicada"
                width={48}
                height={48}
                className="enrolled-thumb-img"
              />
            </div>
            <div className="enrolled-details">
              <span className="enrolled-tag">Curso inscrito</span>
              <strong className="enrolled-course-name">Investigación Criminal Aplicada</strong>
              <div className="enrolled-progress-wrap">
                <div className="enrolled-progress-bar">
                  <div className="enrolled-progress-fill" style={{ width: '90%' }} />
                </div>
                <span className="enrolled-pct">90%</span>
              </div>
              <Link href="/dashboard" className="float-link">
                Continuar curso →
              </Link>
            </div>
          </div>

          {/* 5. 3D EDDIP Logo Emblem (Bottom Center) */}
          <div className="floating-emblem-cube" aria-label="Emblema oficial EDDIP">
            <div className="emblem-cube-inner">
              <Image
                src="/eddip-logo.png"
                alt="EDDIP 3D Emblem"
                width={72}
                height={72}
                className="emblem-cube-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
