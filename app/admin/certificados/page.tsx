'use client';
import { useEffect, useState } from 'react';
import { useDemo } from '@/app/providers';
import { contentService } from '@/lib/supabase/contentService';
import type { Certificate } from '@/lib/types';
import { AdminCertificatesTable } from '@/components/admin/AdminCertificatesTable';

export default function AdminCertificatesPage() {
  const { courses } = useDemo();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    contentService.getCertificates().then(list => {
      if (!mounted) return;
      setCertificates(list);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

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

      <AdminCertificatesTable certificates={certificates} courses={courses} loading={loading} />
    </div>
  );
}
