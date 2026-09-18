'use client';
import { AdminContentEditor } from '@/components/admin/AdminContentEditor';

export default function AdminContentPage() {
  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Sitio Web Público</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Edición de contenido del sitio</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Personaliza el encabezado principal, mensajes institucionales y cifras de impacto en tiempo real.
          </p>
        </div>
      </header>

      <AdminContentEditor />
    </div>
  );
}
