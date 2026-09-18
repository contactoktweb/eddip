import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { CourseCarousel } from '@/components/CourseCarousel';
import { HomeFeaturedCourses } from '@/components/HomeFeaturedCourses';
import { Icon } from '@/lib/icons';
import { baseCourses } from '@/lib/data';
import { QrVisual } from '@/components/QrVisual';

export const metadata: Metadata = {
  title: 'EDDIP · Educación online para profesionales que transforman el mundo',
  description: 'Capacítate con cursos especializados en Seguridad y Policía, Área Jurídica, Gestión Pública y Desarrollo Profesional. Certificados verificables con código QR.',
};

const categories = [
  {
    icon: 'shield',
    name: 'Seguridad y Policía',
    desc: 'Formación especializada para cuerpos de seguridad y convivencia ciudadana.',
  },
  {
    icon: 'scale',
    name: 'Área Jurídica',
    desc: 'Cursos en derecho, normatividad y actualización jurídica para profesionales.',
  },
  {
    icon: 'building',
    name: 'Gestión Pública',
    desc: 'Fortalece tus competencias en la administración y gestión del sector público.',
  },
  {
    icon: 'chart',
    name: 'Desarrollo Profesional',
    desc: 'Habilidades blandas, liderazgo y herramientas para tu crecimiento profesional.',
  },
];

const steps = [
  {
    num: 1,
    icon: 'search',
    title: 'Explora',
    desc: 'Descubre cursos en las áreas que impulsan tu crecimiento.',
  },
  {
    num: 2,
    icon: 'monitor',
    title: 'Inscríbete',
    desc: 'Elige tu curso y accede al contenido al instante.',
  },
  {
    num: 3,
    icon: 'cap',
    title: 'Aprende',
    desc: 'Avanza a tu ritmo con recursos interactivos y expertos.',
  },
  {
    num: 4,
    icon: 'award',
    title: 'Certifícate',
    desc: 'Obtén tu certificado verificable y comparte tus logros.',
  },
];

export default function Home() {
  const featuredCourses = baseCourses.filter((c) => c.featured).slice(0, 6);

  return (
    <>
      <SiteHeader />

      <main className="premium-home">
        {/* HERO SECTION */}
        <section className="premium-hero" aria-label="Introducción a la plataforma EDDIP">
          <div className="hero-shape hero-shape-a" aria-hidden="true" />
          <div className="hero-shape hero-shape-b" aria-hidden="true" />
          <div className="hero-dot-grid" aria-hidden="true" />

          <div className="container premium-hero-grid">
            {/* Left Copy Column */}
            <div className="premium-hero-copy">
              <span className="hero-badge">
                <Icon name="cap" size={14} />
                <span>Bienvenido a EDDIP</span>
              </span>

              <h1 className="hero-headline">
                Educación online<br />
                para profesionales<br />
                que <span className="hero-highlight">transforman el mundo</span>
              </h1>

              <p className="hero-lead">
                Capacítate con cursos especializados diseñados por expertos. Aprende a tu ritmo,
                obtén certificados verificables y avanza en tu carrera profesional.
              </p>

              <div className="hero-actions">
                <Link className="btn hero-btn-light" href="/cursos">
                  <span>Explorar cursos</span>
                  <span className="btn-orb light">
                    <Icon name="arrow" size={14} />
                  </span>
                </Link>

                <Link className="btn hero-btn-ghost" href="/nosotros">
                  <span>Conoce más</span>
                  <Icon name="play" size={16} />
                </Link>
              </div>

              <div className="hero-benefits">
                <div className="benefit-item">
                  <div className="benefit-icon-wrap">
                    <Icon name="award" size={16} />
                  </div>
                  <span>Certificados<br />verificables</span>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon-wrap">
                    <Icon name="refresh" size={16} />
                  </div>
                  <span>Contenido<br />actualizado</span>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon-wrap">
                    <Icon name="play" size={16} />
                  </div>
                  <span>Aprende<br />a tu ritmo</span>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon-wrap">
                    <Icon name="headset" size={16} />
                  </div>
                  <span>Soporte<br />especializado</span>
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
                    <Link href="/dashboard" className="float-link">Ver detalles →</Link>
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
                  <Link href="/dashboard" className="float-link">Continuar curso →</Link>
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

        {/* CATEGORIES SECTION */}
        <section className="home-white-section categories-section" aria-labelledby="cat-heading">
          <div className="container">
            <div className="section-row-head">
              <div>
                <span className="micro-label">ÁREAS DE FORMACIÓN</span>
                <h2 id="cat-heading" className="section-title-clean">
                  Explora nuestras categorías
                </h2>
              </div>
              <Link href="/cursos" className="section-link">
                <span>Ver todas las categorías</span>
                <Icon name="arrow" size={14} />
              </Link>
            </div>

            <div className="premium-category-grid">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/cursos?categoria=${encodeURIComponent(cat.name)}`}
                  className="premium-category-card"
                >
                  <div className="category-icon-big">
                    <Icon name={cat.icon} size={28} />
                  </div>
                  <div className="category-text">
                    <h3 className="category-card-title">{cat.name}</h3>
                    <p className="category-card-desc">{cat.desc}</p>
                  </div>
                  <span className="mini-arrow" aria-hidden="true">
                    <Icon name="chevron" size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED COURSES SECTION (with native mobile swipe gesture) */}
        <section className="home-white-section courses-showcase" aria-labelledby="courses-heading">
          <div className="container">
            <div className="section-row-head">
              <div>
                <span className="micro-label">CURSOS DESTACADOS</span>
                <h2 id="courses-heading" className="section-title-clean">
                  Impulsa tu futuro con nuestros cursos
                </h2>
              </div>
              <Link href="/cursos" className="section-link">
                <span>Ver todos los cursos</span>
                <Icon name="arrow" size={14} />
              </Link>
            </div>

            {/* Courses container: Desktop 3-col grid, Mobile native touch swipe carousel */}
            <HomeFeaturedCourses fallbackCourses={featuredCourses} />
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="blue-process-section" aria-labelledby="process-heading">
          <div className="blue-pattern pattern-left" aria-hidden="true" />
          <div className="blue-pattern pattern-right" aria-hidden="true" />

          <div className="container">
            <div className="center-title light-title">
              <span className="process-eyebrow">¿CÓMO FUNCIONA?</span>
              <h2 id="process-heading" className="process-main-title">
                Aprender en EDDIP es fácil
              </h2>
            </div>

            <div className="premium-process">
              {steps.map((step, idx) => (
                <div key={step.title} className="premium-process-step">
                  <div className="step-circle-wrapper">
                    <span className="process-number">{step.num}</span>
                    <div className="process-icon">
                      <Icon name={step.icon} size={28} />
                    </div>
                  </div>

                  <h3 className="process-step-title">{step.title}</h3>
                  <p className="process-step-desc">{step.desc}</p>

                  {idx < steps.length - 1 && (
                    <div className="process-connector" aria-hidden="true">
                      <svg viewBox="0 0 100 12" className="connector-svg" preserveAspectRatio="none">
                        <line x1="0" y1="6" x2="90" y2="6" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4 4" />
                        <polygon points="90,2 100,6 90,10" fill="rgba(255,255,255,0.7)" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VERIFIABLE CERTIFICATES SECTION */}
        <section className="certificate-band" aria-labelledby="cert-heading">
          <div className="container certificate-band-inner">
            {/* Left Copy */}
            <div className="certificate-copy">
              <span className="micro-label">CERTIFICADOS VERIFICABLES</span>
              <h2 id="cert-heading" className="cert-section-title">
                Valida la autenticidad<br />
                de tu certificado
              </h2>
              <p className="cert-section-p">
                Todos nuestros certificados cuentan con un código único y código QR para
                verificar su autenticidad al instante.
              </p>
              <Link className="btn btn-primary cert-cta" href="/certificados/validar">
                <span>Validar certificado</span>
                <span className="btn-orb">
                  <Icon name="arrow" size={14} />
                </span>
              </Link>
            </div>

            {/* Right Certificate Mockup */}
            <div className="certificate-mock" aria-label="Ejemplo de certificado oficial EDDIP">
              <div className="certificate-paper">
                <div className="cert-brand">
                  <Image src="/eddip-logo.png" alt="EDDIP" width={34} height={34} />
                  <strong>EDDIP</strong>
                </div>

                <span className="cert-overline">CERTIFICADO</span>
                <small className="cert-subline">DE APROBACIÓN</small>

                <p className="cert-granted-to">Otorgado a</p>
                <h3 className="cert-student-name">Sebastián Martínez</h3>

                <p className="cert-reason">Por haber aprobado satisfactoriamente el programa de formación</p>
                <h4 className="cert-course-name">Derecho de Policía y Convivencia Ciudadana</h4>

                <div className="cert-paper-meta">
                  <span>Intensidad: 40 horas</span>
                  <span>Expedición: 2026</span>
                  <span>Código: EDDIP-2026-000145</span>
                </div>

                <div className="cert-paper-signature">
                  <div className="signature-script">Dirección Académica</div>
                  <span className="signature-title">EDDIP Colombia</span>
                </div>
              </div>

              {/* QR Verification Badge */}
              <div className="certificate-qr-card">
                <small>Escanea para verificar</small>
                <div className="qr-box">
                  <QrVisual code="EDDIP-2026-000145" size={78} />
                </div>
                <strong>EDDIP-2026-000145</strong>
              </div>
            </div>
          </div>
        </section>

        {/* STATS & TRUST CTA BANNER */}
        <section className="blue-stats-cta" aria-label="Estadísticas de la plataforma">
          <div className="container stats-cta-grid">
            <div className="stats-copy">
              <h3 className="stats-heading">
                Miles de profesionales<br />
                confían en EDDIP
              </h3>
              <p className="stats-subtext">Educación de calidad que genera impacto real.</p>
            </div>

            <div className="stat-item">
              <Icon name="users" size={28} />
              <div>
                <strong>12.500+</strong>
                <span>Estudiantes</span>
              </div>
            </div>

            <div className="stat-item">
              <Icon name="cap" size={28} />
              <div>
                <strong>250+</strong>
                <span>Cursos disponibles</span>
              </div>
            </div>

            <div className="stat-item">
              <Icon name="award" size={28} />
              <div>
                <strong>8.900+</strong>
                <span>Certificados emitidos</span>
              </div>
            </div>

            <div className="stat-item">
              <Icon name="globe" size={28} />
              <div>
                <strong>15+</strong>
                <span>Países</span>
              </div>
            </div>

            <div className="stats-cta-action">
              <Link className="btn stats-cta-button" href="/cursos">
                <span>Comienza ahora</span>
                <span className="btn-orb light">
                  <Icon name="arrow" size={14} />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
