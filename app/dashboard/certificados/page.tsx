'use client';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { Icon } from '@/lib/icons';
import { StudentCertificatesGrid } from '@/components/student/StudentCertificatesGrid';

export default function StudentCertificatesPage() {
  const { certs, user } = useDemo();

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Acreditación académica</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Mis certificados oficiales</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Consulta, descarga o valida ante terceros tus diplomas y certificados emitidos por EDDIP.
          </p>
        </div>

        <div className="dash-actions">
          <Link className="btn btn-outline" href="/certificados/validar">
            <Icon name="award" /> Validador público
          </Link>
        </div>
      </header>

      <StudentCertificatesGrid certificates={certs} studentName={user.name} />
    </div>
  );
}
