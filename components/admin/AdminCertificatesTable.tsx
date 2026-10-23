'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Certificate, Course } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { useAdminToast } from '@/lib/useAdminToast';
import { AdminToast } from './AdminToast';
import { ManualCertificateForm } from './ManualCertificateForm';

type Props = {
  certificates: Certificate[];
  courses: Course[];
  loading?: boolean;
};

export function AdminCertificatesTable({ certificates, courses, loading = false }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [certsList, setCertsList] = useState<Certificate[]>(certificates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast, showToast } = useAdminToast();

  useEffect(() => {
    setCertsList(certificates);
  }, [certificates]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return certsList.filter(
      c =>
        c.code.toLowerCase().includes(term) ||
        c.student.toLowerCase().includes(term) ||
        c.course.toLowerCase().includes(term) ||
        (c.documentId || '').includes(searchTerm)
    );
  }, [certsList, searchTerm]);

  const handleIssued = (issued: Certificate[]) => {
    setCertsList(prev => [...issued, ...prev]);
    setIsModalOpen(false);
    showToast(
      'success',
      issued.length > 1
        ? `${issued.length} certificados emitidos para ${issued[0].student}.`
        : `Certificado ${issued[0].code} emitido para ${issued[0].student}.`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminToast toast={toast} />

      <div className="admin-toolbar">
        <div className="admin-search">
          <Icon name="search" size={15} />
          <label htmlFor="certificate-search" className="sr-only">Buscar certificados</label>
          <input
            id="certificate-search"
            type="search"
            placeholder="Buscar por código, estudiante, cédula o curso..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-toolbar-actions">
          <Link className="btn btn-outline" href="/certificados/validar" target="_blank">
            <Icon name="award" /> Validador público
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            disabled={courses.length === 0}
          >
            <Icon name="plus" /> Emitir certificado manual
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código oficial</th>
              <th>Estudiante acreditado</th>
              <th>Cédula</th>
              <th>Programa formativo</th>
              <th>Horas</th>
              <th>Fecha de emisión</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="table-empty">Cargando certificados…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">
                  {searchTerm
                    ? `No hay certificados que coincidan con "${searchTerm}".`
                    : 'Aún no se han emitido certificados.'}
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.code}>
                  <td>
                    <strong style={{ fontFamily: 'monospace', color: '#0F59DF' }}>{c.code}</strong>
                  </td>
                  <td className="table-title">{c.student}</td>
                  <td>{c.documentId ? `C.C. ${c.documentId}` : '—'}</td>
                  <td>{c.course}</td>
                  <td>{c.hours} h</td>
                  <td>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{c.date}</span>
                  </td>
                  <td>
                    <span className="badge status-ok">{c.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      className="btn btn-soft"
                      href={`/certificados/${c.code}`}
                      target="_blank"
                      style={{ fontSize: 12, padding: '5px 12px' }}
                    >
                      Visualizar diploma
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ManualCertificateForm courses={courses} onClose={() => setIsModalOpen(false)} onIssued={handleIssued} />
      )}
    </div>
  );
}
