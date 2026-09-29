import type { Metadata } from 'next';
import { AdminRoleManager } from '@/components/admin/AdminRoleManager';

export const metadata: Metadata = {
  title: 'Roles y Permisos Institucionales | EDDIP Administración',
  description: 'Gestión y asignación de roles de Diseñador Instruccional, Administrador y Estudiante en la plataforma EDDIP.',
};

export default function AdminRolesPage() {
  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Seguridad y Control de Acceso</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Roles y Asignación de Permisos</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Supervisa, designa y actualiza los roles de Diseñador Instruccional, Administrador y Estudiante con sincronización en tiempo real en Supabase.
          </p>
        </div>
      </header>

      <AdminRoleManager />
    </div>
  );
}
