import Link from 'next/link';
import { Logo } from './Logo';
import { Icon } from '@/lib/icons';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer premium-footer" role="contentinfo">
      <div className="container premium-footer-grid">
        {/* Columna 1: Marca & Redes */}
        <div className="footer-brand-col">
          <Logo />
          <p>
            Plataforma de educación online especializada para profesionales que transforman el mundo.
          </p>
          <div className="footer-cert-badge">
            <Icon name="shield" size={15} />
            <span>Certificados con Código QR Verificable</span>
          </div>
          <div className="footer-social" aria-label="Redes sociales">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar Facebook de EDDIP"
              title="Facebook"
              className="social-icon-btn social-fb"
            >
              <Icon name="facebook" size={18} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar Instagram de EDDIP"
              title="Instagram"
              className="social-icon-btn social-ig"
            >
              <Icon name="instagram" size={18} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar LinkedIn de EDDIP"
              title="LinkedIn"
              className="social-icon-btn social-li"
            >
              <Icon name="linkedin" size={18} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar canal de YouTube de EDDIP"
              title="YouTube"
              className="social-icon-btn social-yt"
            >
              <Icon name="youtube" size={18} />
            </a>
          </div>
        </div>

        {/* Columna 2: Enlaces Rápidos */}
        <nav className="footer-nav-col" aria-label="Enlaces rápidos">
          <p className="footer-nav-title">Enlaces rápidos</p>
          <ul className="footer-nav-list">
            <li><Link href="/cursos">Explorar Cursos</Link></li>
            <li><Link href="/certificados/validar">Validar Certificado</Link></li>
            <li><Link href="/como-funciona">¿Cómo funciona?</Link></li>
            <li><Link href="/nosotros">Sobre Nosotros</Link></li>
            <li><Link href="/como-funciona">Preguntas frecuentes</Link></li>
          </ul>
        </nav>

        {/* Columna 3: Categorías */}
        <nav className="footer-nav-col" aria-label="Categorías de cursos">
          <p className="footer-nav-title">Categorías</p>
          <ul className="footer-nav-list">
            <li><Link href="/cursos?categoria=Seguridad%20y%20Polic%C3%ADa">Seguridad y Policía</Link></li>
            <li><Link href="/cursos?categoria=%C3%81rea%20Jur%C3%ADdica">Área Jurídica</Link></li>
            <li><Link href="/cursos?categoria=Gesti%C3%B3n%20P%C3%BAblica">Gestión Pública</Link></li>
            <li><Link href="/cursos?categoria=Desarrollo%20Profesional">Desarrollo Profesional</Link></li>
            <li><Link href="/cursos">Todas las categorías</Link></li>
          </ul>
        </nav>

        {/* Columna 4: Soporte */}
        <nav className="footer-nav-col" aria-label="Soporte y legal">
          <p className="footer-nav-title">Soporte</p>
          <ul className="footer-nav-list">
            <li><Link href="/nosotros">Centro de ayuda</Link></li>
            <li><Link href="/nosotros">Contacto</Link></li>
            <li><Link href="/nosotros">Política de privacidad</Link></li>
            <li><Link href="/nosotros">Términos y condiciones</Link></li>
          </ul>
        </nav>

        {/* Columna 5: Asistencia / Contacto directo */}
        <div className="footer-help-col">
          <div className="footer-help-card">
            <div className="footer-help-header">
              <span className="help-icon-bubble" aria-hidden="true">
                <Icon name="headset" size={20} />
              </span>
              <div>
                <p className="footer-help-title">¿Necesitas ayuda?</p>
                <span className="footer-help-status">
                  <span className="status-dot" aria-hidden="true"></span> Asesores en línea
                </span>
              </div>
            </div>
            <p className="footer-help-desc">
              Nuestro equipo académico está listo para acompañarte en tu formación y resolver tus dudas.
            </p>
            <a
              href="https://wa.me/573001234567?text=Hola,%20quisiera%20más%20información%20sobre%20los%20cursos%20de%20EDDIP"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-contact-btn"
              aria-label="Contáctanos vía WhatsApp"
            >
              <Icon name="whatsapp" size={18} />
              <span>Contáctanos</span>
            </a>
          </div>
        </div>
      </div>

      {/* Franja Inferior: Copyright y Branding K&T */}
      <div className="container footer-bottom-wrap">
        <div className="footer-bottom-inner">
          <p className="copyright-text">
            © {currentYear} EDDIP. Todos los derechos reservados.
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
