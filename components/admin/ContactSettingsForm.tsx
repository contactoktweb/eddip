'use client';
import { useEffect, useState } from 'react';
import { Icon } from '@/lib/icons';
import { settingsService } from '@/lib/supabase/settingsService';
import {
  SOCIAL_NETWORKS,
  buildWhatsappUrl,
  defaultSiteSettings,
  formatWhatsappDisplay,
  isValidEmail,
  isValidHttpUrl,
  normalizeWhatsappNumber,
  type SiteSettings,
  type SocialNetworkKey,
} from '@/lib/siteSettings';

type Props = {
  onNotify: (type: 'success' | 'error', message: string) => void;
};

const MIN_WHATSAPP_DIGITS = 10;

function validate(settings: SiteSettings): string | null {
  if (normalizeWhatsappNumber(settings.whatsappNumber).length < MIN_WHATSAPP_DIGITS) {
    return 'Ingresa el número de WhatsApp con indicativo de país, por ejemplo 573145637835.';
  }
  if (!isValidEmail(settings.contactEmail)) return 'El correo de contacto de clientes no es válido.';
  if (!isValidEmail(settings.adminEmail)) return 'El correo administrativo no es válido.';
  for (const network of SOCIAL_NETWORKS) {
    if (!isValidHttpUrl(settings.socialLinks[network.key])) {
      return `El enlace de ${network.label} debe ser una URL completa (https://...).`;
    }
  }
  return null;
}

export function ContactSettingsForm({ onNotify }: Props) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    settingsService.getSiteSettings().then(value => {
      if (!mounted) return;
      setSettings(value);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const update = <K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateSocial = (key: SocialNetworkKey, value: string) => {
    setSettings(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value.trim() } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate(settings);
    if (error) {
      onNotify('error', error);
      return;
    }

    const payload: SiteSettings = {
      ...settings,
      whatsappNumber: normalizeWhatsappNumber(settings.whatsappNumber),
      contactEmail: settings.contactEmail.trim().toLowerCase(),
      adminEmail: settings.adminEmail.trim().toLowerCase(),
    };

    setSaving(true);
    const result = await settingsService.saveSiteSettings(payload);
    setSaving(false);

    if (result.success) {
      setSettings(payload);
      onNotify('success', 'Datos de contacto y redes sociales actualizados en todo el sitio.');
    } else {
      onNotify('error', `No fue posible guardar la configuración. ${result.error ?? ''}`.trim());
    }
  };

  if (loading) {
    return (
      <div className="settings-card settings-loading" aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        <p>Cargando configuración…</p>
      </div>
    );
  }

  return (
    <form className="settings-card ui-fade-up" onSubmit={handleSubmit} noValidate>
      <div className="settings-card-head">
        <span className="settings-card-icon" aria-hidden="true">
          <Icon name="headset" size={20} />
        </span>
        <div>
          <h2>Canales de contacto</h2>
          <p>Se muestran en el pie de página, el centro de ayuda y los correos enviados a los estudiantes.</p>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="settingsWhatsapp">Número de WhatsApp *</label>
          <input
            id="settingsWhatsapp"
            inputMode="tel"
            autoComplete="off"
            value={settings.whatsappNumber}
            onChange={e => update('whatsappNumber', e.target.value)}
            placeholder="573145637835"
            required
          />
          <small className="field-hint">
            Se mostrará como {formatWhatsappDisplay(settings.whatsappNumber) || '—'}.{' '}
            <a href={buildWhatsappUrl(settings)} target="_blank" rel="noopener noreferrer">
              Probar enlace
            </a>
          </small>
        </div>

        <div className="field">
          <label htmlFor="settingsWhatsappMessage">Mensaje inicial de WhatsApp</label>
          <input
            id="settingsWhatsappMessage"
            value={settings.whatsappMessage}
            onChange={e => update('whatsappMessage', e.target.value)}
            placeholder="Hola, quisiera más información sobre los cursos"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="settingsContactEmail">Correo de contacto de clientes *</label>
          <input
            id="settingsContactEmail"
            type="email"
            value={settings.contactEmail}
            onChange={e => update('contactEmail', e.target.value)}
            placeholder="escribenos@eddip.com.co"
            required
          />
          <small className="field-hint">Visible en el sitio y usado como dirección de respuesta de los correos.</small>
        </div>

        <div className="field">
          <label htmlFor="settingsAdminEmail">Correo administrativo *</label>
          <input
            id="settingsAdminEmail"
            type="email"
            value={settings.adminEmail}
            onChange={e => update('adminEmail', e.target.value)}
            placeholder="admin@eddip.com.co"
            required
          />
          <small className="field-hint">Recibe el aviso de cada nuevo registro y de cada compra.</small>
        </div>
      </div>

      <div className="settings-divider" />

      <div className="settings-card-head">
        <span className="settings-card-icon" aria-hidden="true">
          <Icon name="globe" size={20} />
        </span>
        <div>
          <h2>Redes sociales</h2>
          <p>Solo se muestran en el sitio las redes que tengan un enlace configurado.</p>
        </div>
      </div>

      {SOCIAL_NETWORKS.map(network => (
        <div className="field social-field" key={network.key}>
          <label htmlFor={`settings-${network.key}`}>{network.label}</label>
          <div className="input-with-icon">
            <Icon name={network.icon} size={16} />
            <input
              id={`settings-${network.key}`}
              type="url"
              inputMode="url"
              value={settings.socialLinks[network.key]}
              onChange={e => updateSocial(network.key, e.target.value)}
              placeholder={network.placeholder}
            />
          </div>
        </div>
      ))}

      <div className="settings-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Icon name="check" size={16} />
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </form>
  );
}
