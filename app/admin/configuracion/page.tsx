import { AdminSiteSettings } from '@/components/admin/AdminSiteSettings';

export default function AdminSettingsPage() {
  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Configuración del sitio</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Contacto, redes y documentos legales</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Administra los canales de atención, las redes sociales y los documentos legales publicados en la plataforma.
          </p>
        </div>
      </header>

      <AdminSiteSettings />
    </div>
  );
}
