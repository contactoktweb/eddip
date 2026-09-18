'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Certificate, Course } from '@/lib/types';
import { adminService } from '@/lib/supabase/adminService';
import { Icon } from '@/lib/icons';

type Props = {
  certificates: Certificate[];
  courses: Course[];
};

export function AdminCertificatesTable({ certificates, courses }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [certsList, setCertsList] = useState<Certificate[]>(certificates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Campos para emisión manual
  const [studentName, setStudentName] = useState('');
  const [courseSlug, setCourseSlug] = useState(courses[0]?.slug || '');

  const filtered = useMemo(() => {
    return certsList.filter(
      c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.course.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [certsList, searchTerm]);

  const handleIssueManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !courseSlug) return;

    const selectedCourse = courses.find(c => c.slug === courseSlug);
    const newCode = `EDDIP-2026-MAN${Math.floor(100 + Math.random() * 900)}`;

    const newCert: Certificate = {
      code: newCode,
      student: studentName.trim(),
      courseSlug,
      course: selectedCourse?.title || 'Curso Certificado',
      hours: selectedCourse?.durationHours || 40,
      date: new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
      status: 'Válido',
    };

    await adminService.issueManualCertificate(newCert);
    setCertsList(prev => [newCert, ...prev]);
    setIsModalOpen(false);
    setStudentName('');
    setToast(`¡Certificado ${newCode} emitido con éxito!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Feedback */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 12,
            background: '#ecfdf5',
            color: '#059669',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Icon name="check" size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Controles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          background: '#fff',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ position: 'relative', minWidth: 280, maxWidth: 380, flex: 1 }}>
          <input
            type="search"
            placeholder="Buscar por código, estudiante o curso..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 36px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              fontSize: 13,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8b9bb4',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="search" size={15} />
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn btn-outline" href="/certificados/validar" target="_blank">
            <Icon name="award" /> Validador público
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon name="plus" /> Emitir certificado manual
          </button>
        </div>
      </div>

      {/* Tabla de Certificados */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código oficial</th>
              <th>Estudiante acreditado</th>
              <th>Programa formativo</th>
              <th>Horas</th>
              <th>Fecha de emisión</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.code}>
                <td>
                  <strong style={{ fontFamily: 'monospace', color: '#0F59DF' }}>
                    {c.code}
                  </strong>
                </td>
                <td className="table-title">{c.student}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Emisión Manual */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 21, 43, 0.45)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <div
            className="panel"
            style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: 20, padding: 28 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, margin: 0 }}>Emitir Certificado Oficial Manual</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueManual} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label htmlFor="studentFullName">Nombre completo del estudiante *</label>
                <input
                  id="studentFullName"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Ej. Andrés Felipe Gómez"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="certCourse">Programa a certificar *</label>
                <select
                  id="certCourse"
                  value={courseSlug}
                  onChange={e => setCourseSlug(e.target.value)}
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.slug}>
                      {c.title} ({c.durationHours} h)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Generar y registrar certificado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
