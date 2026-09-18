'use client';
import { StudentProfileManager } from '@/components/student/StudentProfileManager';

export default function StudentProfilePage() {
  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Configuración de cuenta</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Mi perfil de estudiante</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Administra tus datos personales, credenciales de acceso y consulta tu resumen académico.
          </p>
        </div>
      </header>

      <StudentProfileManager />
    </div>
  );
}
