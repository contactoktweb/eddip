'use client';
import { Icon } from '@/lib/icons';
import { buildWhatsappUrl, formatWhatsappDisplay } from '@/lib/siteSettings';
import { useSiteSettings } from '@/lib/useSiteSettings';

export function HelpContactChannels() {
  const settings = useSiteSettings();

  return (
    <div className="help-contact-grid">
      <a
        className="help-contact-card help-contact-whatsapp"
        href={buildWhatsappUrl(settings)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="help-contact-icon" aria-hidden="true">
          <Icon name="whatsapp" size={24} />
        </span>
        <span className="help-contact-body">
          <strong>Escríbenos por WhatsApp</strong>
          <span>{formatWhatsappDisplay(settings.whatsappNumber)}</span>
          <small>Respuesta rápida de nuestros asesores académicos</small>
        </span>
        <Icon name="arrow" size={18} className="help-contact-arrow" />
      </a>

      <a className="help-contact-card" href={`mailto:${settings.contactEmail}`}>
        <span className="help-contact-icon" aria-hidden="true">
          <Icon name="mail" size={24} />
        </span>
        <span className="help-contact-body">
          <strong>Envíanos un correo</strong>
          <span>{settings.contactEmail}</span>
          <small>Solicitudes, certificados y facturación</small>
        </span>
        <Icon name="arrow" size={18} className="help-contact-arrow" />
      </a>
    </div>
  );
}
