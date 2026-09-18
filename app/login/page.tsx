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
      <main className="auth-page" style={{ padding: '60px 20px' }}>
        <div className="auth-card">
          {/* Arte lateral corporativo */}
          <section className="auth-art" aria-label="Información institucional">
            <Logo />
            <h1 style={{ fontSize: 32, lineHeight: 1.25, margin: '24px 0 14px' }}>
              Tu espacio de aprendizaje, en un solo lugar.
            </h1>
            <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.6 }}>
              Accede a tus cursos interactivos, continúa tu avance lección a lección, presenta evaluaciones de certificación y valida diplomas con registro en Supabase.
            </p>

            <div className="hero-trust" style={{ color: 'rgba(255,255,255,0.9)', marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Icon name="check" size={16} /> Contenido normativo y técnico actualizado
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Icon name="check" size={16} /> Seguimiento de progreso en tiempo real
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Icon name="check" size={16} /> Certificados con código de verificación QR
              </span>
            </div>
          </section>

          {/* Sección de autenticación modular */}
          <section className="auth-form" aria-label="Formulario de acceso">
            <StudentAuth />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
