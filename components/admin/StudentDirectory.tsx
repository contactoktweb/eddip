'use client';
import { useState, useMemo } from 'react';
import { Icon } from '@/lib/icons';
import type { EnrichedStudent } from '@/lib/supabase/adminService';
import { StudentDetailModal } from './StudentDetailModal';

type FilterStatus = 'all' | 'active' | 'completed' | 'zero';

type Props = {
  students: EnrichedStudent[];
};

export function StudentDirectory({ students }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedStudent, setSelectedStudent] = useState<EnrichedStudent | null>(null);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.documentId && s.documentId.includes(searchTerm)) ||
        (s.city && s.city.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterStatus === 'completed') return s.progressAvg >= 100;
      if (filterStatus === 'active') return s.progressAvg > 0 && s.progressAvg < 100;
      if (filterStatus === 'zero') return s.progressAvg === 0;

      return true;
    });
  }, [students, searchTerm, filterStatus]);

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Correo', 'Documento', 'Ciudad', 'Cursos', 'Progreso (%)', 'Certificados', 'Registro'];
    const rows = filtered.map(s => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.documentId || ''}"`,
      `"${s.city || ''}"`,
      s.coursesCount,
      s.progressAvg,
      s.certificatesCount,
      `"${s.registeredAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estudiantes_eddip_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controles de búsqueda, filtros y exportación */}
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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 260, maxWidth: 360, flex: 1 }}>
            <input
              type="search"
              placeholder="Buscar por nombre, correo, cédula o ciudad..."
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

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 12px', fontSize: 12 }}
              onClick={() => setFilterStatus('all')}
            >
              Todos ({students.length})
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'active' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 12px', fontSize: 12 }}
              onClick={() => setFilterStatus('active')}
            >
              En progreso
            </button>
            <button
              type="button"
              className={`btn ${filterStatus === 'completed' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 12px', fontSize: 12 }}
              onClick={() => setFilterStatus('completed')}
            >
              Completados (100%)
            </button>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleExportCSV}
          style={{ fontSize: 13, padding: '9px 16px' }}
        >
          <Icon name="upload" /> Exportar CSV
        </button>
      </div>

      {/* Tabla de Estudiantes */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Contacto</th>
              <th>Cursos</th>
              <th>Progreso promedio</th>
              <th>Certificados</th>
              <th>Fecha de registro</th>
              <th style={{ textAlign: 'right' }}>Ficha académica</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      className="avatar"
                      style={{ width: 34, height: 34, fontSize: 12, borderRadius: 10 }}
                    >
                      {s.name
                        .split(' ')
                        .filter(Boolean)
                        .map(x => x[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="table-title">{s.name}</div>
                      <small style={{ color: '#7a8b9e' }}>{s.city || 'Colombia'}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 12 }}>
                    <div>{s.email}</div>
                    <small style={{ color: '#8b9bb4' }}>{s.phone || 'Sin teléfono'}</small>
                  </div>
                </td>
                <td>
                  <span className="badge">{s.coursesCount} cursos</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress" style={{ width: 85 }}>
                      <span
                        style={{
                          width: `${s.progressAvg}%`,
                          background: s.progressAvg >= 100 ? '#059669' : undefined,
                        }}
                      ></span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s.progressAvg}%</span>
                  </div>
                </td>
                <td>
                  {s.certificatesCount > 0 ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: '#059669',
                        fontWeight: 600,
                      }}
                    >
                      <Icon name="award" size={14} /> {s.certificatesCount}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>0</span>
                  )}
                </td>
                <td>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{s.registeredAt}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={() => setSelectedStudent(s)}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    Ver ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Ficha Detallada */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
