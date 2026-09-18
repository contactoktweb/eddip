'use client';
import { Logo } from '@/components/Logo';
import { Icon } from '@/lib/icons';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { StudentAuth } from '@/components/student/StudentAuth';

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <div className="auth-card">
          {/* Arte lateral corporativo e institucional */}
          <section className="auth-art" aria-label="Información institucional de EDDIP">
            <div className="auth-art-glow-top" />
            <div className="auth-art-glow-bottom" />

            <div className="auth-art-inner">
              <div className="auth-art-brand">
                <Logo light />
              </div>

              <div className="auth-art-badge">
                <Icon name="shield" size={14} />
                <span>Educación Superior y Continua</span>
              </div>

              <h1 className="auth-art-title">
                Tu espacio de aprendizaje, en un solo lugar.
              </h1>

              <p className="auth-art-desc">
                Accede a tus cursos interactivos, continúa tu avance lección a lección, presenta evaluaciones de certificación y valida diplomas con acreditación y verificación oficial mediante código QR único.
              </p>

              <div className="auth-art-benefits">
                <div className="auth-art-benefit-item">
                  <div className="auth-art-check">
                    <Icon name="check" size={14} />
                  </div>
                  <span>Contenido normativo y técnico actualizado</span>
                </div>
                <div className="auth-art-benefit-item">
                  <div className="auth-art-check">
                    <Icon name="check" size={14} />
                  </div>
                  <span>Seguimiento de progreso lección a lección</span>
                </div>
                <div className="auth-art-benefit-item">
                  <div className="auth-art-check">
                    <Icon name="check" size={14} />
                  </div>
                  <span>Certificados oficiales con código de validación QR</span>
                </div>
              </div>

              <div className="auth-art-trust-card">
                <div className="auth-trust-icon-box">
                  <Icon name="award" size={22} />
                </div>
                <div className="auth-trust-content">
                  <strong>Acreditación Institucional Garantizada</strong>
                  <p>Programas diseñados según los estándares normativos vigentes para servidores públicos y profesionales.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sección de autenticación modular */}
          <section className="auth-form" aria-label="Formulario de acceso institucional">
            <StudentAuth />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
