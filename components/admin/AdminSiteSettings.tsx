'use client';
import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { useAdminToast } from '@/lib/useAdminToast';
import type { LegalDocumentKey } from '@/lib/legalDocuments';
import { AdminToast } from './AdminToast';
import { ContactSettingsForm } from './ContactSettingsForm';
import { LegalDocumentEditor } from './LegalDocumentEditor';

type SettingsTab = 'contacto' | LegalDocumentKey;

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'contacto', label: 'Contacto y redes', icon: 'headset' },
  { key: 'privacyPolicy', label: 'Política de privacidad', icon: 'lock' },
  { key: 'termsConditions', label: 'Términos y condiciones', icon: 'file' },
];

export function AdminSiteSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('contacto');
  const { toast, showToast } = useAdminToast();

  return (
    <div className="settings-layout">
      <AdminToast toast={toast} />

      <div className="settings-tabs" role="tablist" aria-label="Secciones de configuración">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`settings-tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`settings-panel-${tab.key}`}
            className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon name={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`settings-panel-${activeTab}`} aria-labelledby={`settings-tab-${activeTab}`}>
        {activeTab === 'contacto' ? (
          <ContactSettingsForm onNotify={showToast} />
        ) : (
          <LegalDocumentEditor key={activeTab} documentKey={activeTab} onNotify={showToast} />
        )}
      </div>
    </div>
  );
}
