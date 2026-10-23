import Link from 'next/link';
import { Logo } from './Logo';
import { FooterSocialLinks } from './FooterSocialLinks';
import { FooterHelpCard } from './FooterHelpCard';
import { FooterCategoryLinks } from './FooterCategoryLinks';
import { LEGAL_DOCUMENT_ROUTES } from '@/lib/legalDocuments';
import { BRAND_OFFICIAL_NAME } from '@/lib/brand';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer premium-footer" role="contentinfo">
      <div className="container premium-footer-grid">
        {/* Columna 1: Marca & Redes */}
        <div className="footer-brand-col">
          <Logo />
          <p>
            {BRAND_OFFICIAL_NAME}. Plataforma de educación online especializada para profesionales que transforman el mundo.
          </p>
          <FooterSocialLinks />
        </div>

        {/* Columna 2: Enlaces Rápidos */}
        <nav className="footer-nav-col" aria-label="Enlaces rápidos">
          <p className="footer-nav-title">Enlaces rápidos</p>
          <ul className="footer-nav-list">
            <li><Link href="/cursos">Explorar Cursos</Link></li>
            <li><Link href="/certificados/validar">Validar Certificado</Link></li>
            <li><Link href="/como-funciona">¿Cómo funciona?</Link></li>
            <li><Link href="/nosotros">Sobre Nosotros</Link></li>
            <li><Link href="/ayuda#preguntas-frecuentes">Preguntas frecuentes</Link></li>
          </ul>
        </nav>

        {/* Columna 3: Categorías */}
        <nav className="footer-nav-col" aria-label="Categorías de cursos">
          <p className="footer-nav-title">Categorías</p>
          <FooterCategoryLinks />
        </nav>

        {/* Columna 4: Soporte */}
        <nav className="footer-nav-col" aria-label="Soporte y legal">
          <p className="footer-nav-title">Soporte</p>
          <ul className="footer-nav-list">
            <li><Link href="/ayuda">Centro de ayuda</Link></li>
            <li><Link href="/ayuda#contacto">Contacto</Link></li>
            <li><Link href={LEGAL_DOCUMENT_ROUTES.privacyPolicy}>Política de privacidad</Link></li>
            <li><Link href={LEGAL_DOCUMENT_ROUTES.termsConditions}>Términos y condiciones</Link></li>
          </ul>
        </nav>

        {/* Columna 5: Asistencia / Contacto directo */}
        <div className="footer-help-col">
          <FooterHelpCard />
        </div>
      </div>

      {/* Franja Inferior: Copyright y Branding K&T */}
      <div className="container footer-bottom-wrap">
        <div className="footer-bottom-inner">
          <p className="copyright-text">
            © {currentYear} {BRAND_OFFICIAL_NAME}. Todos los derechos reservados.
          </p>

          <div className="footer-credits">
            <span className="footer-tagline">
              Hecho con <span className="heart-white" aria-label="amor">♥</span> para tu crecimiento profesional.
            </span>
            <span className="credits-sep" aria-hidden="true">·</span>
            <a
              href="https://www.kytcode.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="kyt-link"
              title="Desarrollado por K&T"
            >
              Desarrollado por K&T <span className="heart-white" aria-hidden="true">♥</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
