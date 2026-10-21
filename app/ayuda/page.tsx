import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { HelpContactChannels } from '@/components/HelpContactChannels';
import { Icon } from '@/lib/icons';
import { helpFaqGroups, helpQuickLinks } from '@/lib/helpCenter';

export const metadata: Metadata = {
  title: 'Centro de Ayuda y Preguntas Frecuentes · EDDIP',
  description:
    'Resuelve tus dudas sobre registro, recuperación de contraseña, inscripción y pago de cursos virtuales y certificados de EDDIP, o contáctanos por WhatsApp y correo.',
  alternates: { canonical: '/ayuda' },
};

export default function HelpCenterPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero help-hero">
          <div className="container">
            <span className="eyebrow">Soporte al estudiante</span>
            <h1>Centro de ayuda EDDIP</h1>
            <p>
              Encuentra respuestas sobre tu cuenta, la inscripción a cursos virtuales y la expedición de certificados,
              o comunícate directamente con nuestro equipo académico.
            </p>
          </div>
        </section>

        <section className="section" aria-labelledby="ayuda-accesos">
          <div className="container">
            <h2 id="ayuda-accesos" className="help-section-title">¿En qué podemos ayudarte?</h2>
            <div className="help-quick-grid">
              {helpQuickLinks.map(link => (
                <Link key={link.href} href={link.href} className="help-quick-card">
                  <span className="category-icon" aria-hidden="true">
                    <Icon name={link.icon} />
                  </span>
                  <h3>{link.title}</h3>
                  <p>{link.description}</p>
                  <span className="text-link">
                    Ir ahora <Icon name="arrow" size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="preguntas-frecuentes" className="section soft help-faq-section" aria-labelledby="ayuda-faq">
          <div className="container help-faq-layout">
            <div>
              <h2 id="ayuda-faq" className="help-section-title">Preguntas frecuentes</h2>
              <p>Las dudas más comunes de nuestros estudiantes, organizadas por tema.</p>
            </div>

            <div className="help-faq-groups">
              {helpFaqGroups.map(group => (
                <div key={group.title} className="help-faq-group">
                  <h3>{group.title}</h3>
                  {group.items.map(item => (
                    <details key={item.question} className="help-faq-item">
                      <summary>
                        <span>{item.question}</span>
                        <Icon name="chevron-down" size={18} />
                      </summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contacto" className="section" aria-labelledby="ayuda-contacto">
          <div className="container">
            <h2 id="ayuda-contacto" className="help-section-title">Contacto directo</h2>
            <p className="help-section-lead">
              ¿No encontraste lo que buscabas? Nuestro equipo te atiende por estos canales.
            </p>
            <HelpContactChannels />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
