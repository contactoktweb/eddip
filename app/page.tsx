import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { CourseCarousel } from '@/components/CourseCarousel';
import { HomeFeaturedCourses } from '@/components/HomeFeaturedCourses';
import { HomeHeroSection } from '@/components/HomeHeroSection';
import { HomeStatsSection } from '@/components/HomeStatsSection';
import { QrVisual } from '@/components/QrVisual';
import { Icon } from '@/lib/icons';
import { baseCourses } from '@/lib/data';

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
        {/* HERO SECTION DINÁMICO */}
        <HomeHeroSection />


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
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', margin: '-4px 0 10px', fontWeight: 600, letterSpacing: '0.5px' }}>
                  C.C. 1.032.456.789
                </span>

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

        {/* STATS & TRUST CTA BANNER DINÁMICO */}
        <HomeStatsSection />
      </main>

      <Footer />
    </>
  );
}
