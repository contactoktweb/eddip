'use client';
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel';

export default function AdminSettingsPage() {
  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Ajustes Generales</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Configuración de la plataforma</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Configura parámetros del sistema, notificaciones de compras y opciones de mantenimiento.
          </p>
        </div>
      </header>

      <AdminSettingsPanel />
    </div>
  );
}
