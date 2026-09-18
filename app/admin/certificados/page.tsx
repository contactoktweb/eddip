'use client';
import { useDemo } from '@/app/providers';
import { AdminCertificatesTable } from '@/components/admin/AdminCertificatesTable';

export default function AdminCertificatesPage() {
  const { certs, courses } = useDemo();

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Acreditación Institucional</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Registro oficial de certificados</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Supervisa los diplomas emitidos, genera certificaciones manuales y valida autenticidad con código único.
          </p>
        </div>
      </header>

      <AdminCertificatesTable certificates={certs} courses={courses} />
    </div>
  );
}
