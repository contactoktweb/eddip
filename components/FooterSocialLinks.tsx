'use client';
import { Icon } from '@/lib/icons';
import { SOCIAL_NETWORKS } from '@/lib/siteSettings';
import { useSiteSettings } from '@/lib/useSiteSettings';

const SOCIAL_CLASS: Record<string, string> = {
  facebook: 'social-fb',
  instagram: 'social-ig',
  tiktok: 'social-tt',
};

export function FooterSocialLinks() {
  const { socialLinks } = useSiteSettings();
  const networks = SOCIAL_NETWORKS.filter(n => socialLinks[n.key]);

  if (networks.length === 0) return null;

  return (
    <div className="footer-social" aria-label="Redes sociales de EDDIP">
      {networks.map(network => (
        <a
          key={network.key}
          href={socialLinks[network.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visitar ${network.label} de EDDIP`}
          title={network.label}
          className={`social-icon-btn ${SOCIAL_CLASS[network.key]}`}
        >
          <Icon name={network.icon} size={18} />
        </a>
      ))}
    </div>
  );
}
