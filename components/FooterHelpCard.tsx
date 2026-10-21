'use client';
import { Icon } from '@/lib/icons';
import { buildWhatsappUrl, formatWhatsappDisplay } from '@/lib/siteSettings';
import { useSiteSettings } from '@/lib/useSiteSettings';

export function FooterHelpCard() {
  const settings = useSiteSettings();
  const whatsappUrl = buildWhatsappUrl(settings);
  const whatsappDisplay = formatWhatsappDisplay(settings.whatsappNumber);

  return (
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
      <ul className="footer-help-contacts">
        <li>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escribir por WhatsApp al ${whatsappDisplay}`}
          >
            <Icon name="whatsapp" size={15} />
            <span>{whatsappDisplay}</span>
          </a>
        </li>
        <li>
          <a href={`mailto:${settings.contactEmail}`} aria-label={`Enviar correo a ${settings.contactEmail}`}>
            <Icon name="mail" size={15} />
            <span>{settings.contactEmail}</span>
          </a>
        </li>
      </ul>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="footer-contact-btn"
        aria-label="Contáctanos vía WhatsApp"
      >
        <Icon name="whatsapp" size={18} />
        <span>Contáctanos</span>
      </a>
    </div>
  );
}
