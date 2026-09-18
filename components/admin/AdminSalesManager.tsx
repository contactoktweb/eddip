'use client';
import { useState, useMemo } from 'react';
import type { Sale } from '@/lib/types';
import { money } from '@/lib/data';
import { StatCard } from '@/components/StatCard';
import { Icon } from '@/lib/icons';

type Props = {
  sales: Sale[];
};

export function AdminSalesManager({ sales }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('Todos');

  const totalSold = useMemo(() => sales.reduce((acc, s) => acc + s.value, 0), [sales]);
  const avgTicket = useMemo(() => (sales.length > 0 ? Math.round(totalSold / sales.length) : 0), [sales, totalSold]);

  const methods = useMemo(() => {
    const list = Array.from(new Set(sales.map(s => s.method)));
    return ['Todos', ...list];
  }, [sales]);

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const matchSearch =
        s.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMethod = methodFilter === 'Todos' || s.method === methodFilter;

      return matchSearch && matchMethod;
    });
  }, [sales, searchTerm, methodFilter]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Estudiante', 'Curso', 'Valor', 'Metodo', 'Fecha', 'Estado'];
    const rows = filtered.map(s => [
      `"${s.id}"`,
      `"${s.student}"`,
      `"${s.course}"`,
      s.value,
      `"${s.method}"`,
      `"${s.date}"`,
      `"${s.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ventas_eddip_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tarjetas de métricas comerciales */}
      <div className="stats-grid">
        <StatCard label="Total recaudado" value={money(totalSold)} icon="dollar" />
        <StatCard label="Inscripciones procesadas" value={sales.length} icon="check" />
        <StatCard label="Ticket promedio" value={money(avgTicket)} icon="card" />
        <StatCard label="Tasa de aprobación" value="98.4%" icon="chart" />
      </div>

      {/* Barra de filtros */}
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 260, maxWidth: 360, flex: 1 }}>
            <input
              type="search"
              placeholder="Buscar por estudiante, curso o ID..."
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

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              fontSize: 13,
              background: '#fff',
            }}
          >
            {methods.map(m => (
              <option key={m} value={m}>
                {m === 'Todos' ? 'Todos los métodos de pago' : m}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleExportCSV}
          style={{ fontSize: 13 }}
        >
          <Icon name="upload" /> Exportar reporte CSV
        </button>
      </div>

      {/* Tabla de Ventas */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Transacción</th>
              <th>Estudiante</th>
              <th>Curso adquirido</th>
              <th>Monto (COP)</th>
              <th>Método de pago</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <strong style={{ fontFamily: 'monospace', color: '#0F59DF' }}>{s.id}</strong>
                </td>
                <td className="table-title">{s.student}</td>
                <td>{s.course}</td>
                <td>
                  <strong style={{ color: '#071F49' }}>{money(s.value)}</strong>
                </td>
                <td>
                  <span className="cover-chip" style={{ fontSize: 11 }}>
                    {s.method}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{s.date}</span>
                </td>
                <td>
                  <span className="badge status-ok">{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
