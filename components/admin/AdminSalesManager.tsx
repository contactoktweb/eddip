'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Sale, Course } from '@/lib/types';
import { money, baseCourses } from '@/lib/data';
import { StatCard } from '@/components/StatCard';
import { Icon } from '@/lib/icons';
import { adminService } from '@/lib/supabase/adminService';
import { contentService } from '@/lib/supabase/contentService';

type Props = {
  sales: Sale[];
  onUpdateStatus?: (saleId: string, newStatus: string) => Promise<void> | void;
  onAddSale?: (sale: Sale) => Promise<void> | void;
  onDeleteSale?: (saleId: string) => Promise<void> | void;
};

export function AdminSalesManager({ sales, onUpdateStatus, onAddSale, onDeleteSale }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [availableCourses, setAvailableCourses] = useState<Course[]>(baseCourses);

  useEffect(() => {
    contentService
      .getCourses()
      .then(res => {
        if (res && res.length > 0) setAvailableCourses(res);
      })
      .catch(() => {});
  }, []);

  // Formulario de nueva venta manual
  const [newSaleData, setNewSaleData] = useState({
    student: '',
    email: '',
    documentId: '',
    course: baseCourses[0]?.title || 'Derecho de Policía',
    value: baseCourses[0]?.price || 45000,
    method: 'Bold',
    status: 'Aprobado',
    date: new Date().toISOString().slice(0, 10),
  });

  // Métricas dinámicas calculadas sobre las transacciones
  const approvedSales = useMemo(() => sales.filter(s => s.status === 'Aprobado'), [sales]);
  const totalSold = useMemo(() => approvedSales.reduce((acc, s) => acc + s.value, 0), [approvedSales]);
  const avgTicket = useMemo(
    () => (approvedSales.length > 0 ? Math.round(totalSold / approvedSales.length) : 0),
    [approvedSales, totalSold]
  );
  const approvalRate = useMemo(() => {
    if (sales.length === 0) return '0.0%';
    const pct = (approvedSales.length / sales.length) * 100;
    return `${pct.toFixed(1)}%`;
  }, [sales, approvedSales]);

  // Lista de métodos disponibles
  const methods = useMemo(() => {
    const list = Array.from(new Set(sales.map(s => s.method)));
    return ['Todos', ...list];
  }, [sales]);

  // Filtrado reactivo por término de búsqueda, método y estado
  const filtered = useMemo(() => {
    return sales.filter(s => {
      const matchSearch =
        s.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMethod = methodFilter === 'Todos' || s.method === methodFilter;
      const matchStatus = statusFilter === 'Todos' || s.status === statusFilter;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [sales, searchTerm, methodFilter, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Cambio de estado interactivo
  const handleStatusChange = async (saleId: string, newStatus: string) => {
    if (onUpdateStatus) {
      await onUpdateStatus(saleId, newStatus);
    } else {
      await adminService.updateSaleStatus(saleId, newStatus);
    }
    showToast(`Estado de la transacción ${saleId} actualizado a "${newStatus}"`);
  };

  // Creación de nueva venta
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSaleData.student.trim()) return;

    const newId = `VEN-${Date.now().toString().slice(-4)}`;
    const saleToCreate: Sale = {
      id: newId,
      student: newSaleData.student.trim(),
      course: newSaleData.course,
      value: Number(newSaleData.value) || 0,
      method: newSaleData.method,
      date: newSaleData.date || new Date().toISOString().slice(0, 10),
      status: newSaleData.status,
    };

    if (onAddSale) {
      await onAddSale(saleToCreate);
    } else {
      await adminService.recordSale(saleToCreate);
    }

    // Matricular al estudiante si la venta fue aprobada
    if (saleToCreate.status === 'Aprobado') {
      const matchedCourse = availableCourses.find(c => c.title === saleToCreate.course) || baseCourses.find(c => c.title === saleToCreate.course);
      const courseSlug = matchedCourse ? matchedCourse.slug : 'derecho-de-policia';
      const cleanEmail = newSaleData.email?.trim() || `${saleToCreate.student.toLowerCase().replace(/\s+/g, '.')}@estudiante.eddip.co`;
      await adminService.enrollStudentInCourse(
        saleToCreate.student,
        cleanEmail,
        courseSlug,
        saleToCreate.course,
        {
          documentId: newSaleData.documentId?.trim() || undefined,
        }
      );
    }

    setIsModalOpen(false);
    setNewSaleData({
      student: '',
      email: '',
      documentId: '',
      course: availableCourses[0]?.title || baseCourses[0]?.title || 'Derecho de Policía',
      value: availableCourses[0]?.price || baseCourses[0]?.price || 45000,
      method: 'Bold',
      status: 'Aprobado',
      date: new Date().toISOString().slice(0, 10),
    });
    showToast(`Venta ${newId} registrada y sincronizada exitosamente`);
  };

  // Exportar reporte CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Estudiante', 'Curso', 'Valor_COP', 'Metodo', 'Fecha', 'Estado'];
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
    showToast('Reporte financiero exportado en formato CSV');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Notificación Toast flotante */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: '#071F49',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(7, 31, 73, 0.25)',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'customSelectIn 0.2s ease-out forwards',
          }}
        >
          <span style={{ color: '#10b981' }}>
            <Icon name="check" size={16} />
          </span>
          {toastMessage}
        </div>
      )}

      {/* Tarjetas de métricas comerciales */}
      <div className="stats-grid">
        <StatCard label="Total recaudado (Aprobado)" value={money(totalSold)} icon="dollar" />
        <StatCard label="Inscripciones procesadas" value={sales.length} icon="check" />
        <StatCard label="Ticket promedio" value={money(avgTicket)} icon="card" />
        <StatCard label="Tasa de aprobación" value={approvalRate} icon="chart" />
      </div>

      {/* Barra de filtros y acciones */}
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
          {/* Buscador */}
          <div style={{ position: 'relative', minWidth: 240, maxWidth: 340, flex: 1 }}>
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
                outline: 'none',
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

          {/* Filtro de Métodos de Pago */}
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              fontSize: 13,
              background: '#fff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {methods.map(m => (
              <option key={m} value={m}>
                {m === 'Todos' ? 'Todos los métodos de pago' : m}
              </option>
            ))}
          </select>

          {/* Filtro de Estado */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              fontSize: 13,
              background: '#fff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Rechazado">Rechazado</option>
            <option value="Reembolsado">Reembolsado</option>
          </select>
        </div>

        {/* Acciones principales */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ fontSize: 13, padding: '9px 16px' }}
          >
            <Icon name="plus" size={15} /> Registrar venta manual
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleExportCSV}
            style={{ fontSize: 13, padding: '9px 16px' }}
          >
            <Icon name="upload" size={15} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla de Ventas Reactiva */}
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
              <th>Estado (Actualizable)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 440, margin: '0 auto' }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: '#eff6ff',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#0b62dd',
                      }}
                    >
                      <Icon name="card" size={24} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: 16 }}>
                        {searchTerm || methodFilter !== 'Todos' || statusFilter !== 'Todos'
                          ? 'No se encontraron ventas para los filtros'
                          : 'Sin ventas registradas en la base de datos'}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                        {searchTerm || methodFilter !== 'Todos' || statusFilter !== 'Todos'
                          ? 'Intenta modificando los criterios de búsqueda o limpiando los filtros.'
                          : 'Las ventas realizadas automáticamente por los estudiantes a través de Bold o las registradas de forma manual aparecerán aquí sincronizadas en tiempo real con Supabase.'}
                      </p>
                    </div>
                    {!searchTerm && methodFilter === 'Todos' && statusFilter === 'Todos' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setIsModalOpen(true)}
                        style={{ marginTop: 8, fontSize: 13, padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Icon name="card" size={15} /> Registrar primera venta manual
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(s => {
                const isApproved = s.status === 'Aprobado';
                const isPending = s.status === 'Pendiente';
                const isRejected = s.status === 'Rechazado';
                const isRefunded = s.status === 'Reembolsado';

                return (
                  <tr key={s.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: '#0F59DF', fontSize: 13 }}>
                        {s.id}
                      </strong>
                    </td>
                    <td className="table-title" style={{ fontWeight: 600 }}>
                      {s.student}
                    </td>
                    <td>{s.course}</td>
                    <td>
                      <strong style={{ color: '#071F49' }}>{money(s.value)}</strong>
                    </td>
                    <td>
                      <span className="cover-chip" style={{ fontSize: 11, fontWeight: 600 }}>
                        {s.method}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{s.date}</span>
                    </td>
                    <td>
                      {/* Selector de Estado Interactivo */}
                      <select
                        value={s.status}
                        onChange={e => handleStatusChange(s.id, e.target.value)}
                        aria-label={`Actualizar estado de ${s.id}`}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          border: isApproved
                            ? '1px solid #b7ebd0'
                            : isPending
                            ? '1px solid #fde047'
                            : isRejected
                            ? '1px solid #fca5a5'
                            : '1px solid #d8b4fe',
                          background: isApproved
                            ? '#e9f8f0'
                            : isPending
                            ? '#fef9c3'
                            : isRejected
                            ? '#fee2e2'
                            : '#f3e8ff',
                          color: isApproved
                            ? '#0d8a4e'
                            : isPending
                            ? '#a16207'
                            : isRejected
                            ? '#dc2626'
                            : '#7e22ce',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <option value="Aprobado">✓ Aprobado</option>
                        <option value="Pendiente">⏳ Pendiente</option>
                        <option value="Rechazado">✕ Rechazado</option>
                        <option value="Reembolsado">↩ Reembolsado</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Registrar Venta Manual */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 31, 73, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 500,
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              border: '1px solid #e2e8f0',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#eff6ff',
                    color: '#0b62dd',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name="card" size={18} />
                </div>
                <h2 style={{ fontSize: 18, color: '#071F49', margin: 0, fontWeight: 700 }}>
                  Registrar Venta / Pago Manual
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 4,
                }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSale} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Nombre y Apellidos del Estudiante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Diana Carolina Vargas"
                  value={newSaleData.student}
                  onChange={e => setNewSaleData({ ...newSaleData, student: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="estudiante@correo.com"
                    value={newSaleData.email}
                    onChange={e => setNewSaleData({ ...newSaleData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Cédula / Documento (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="1.032.456.789"
                    value={newSaleData.documentId}
                    onChange={e => setNewSaleData({ ...newSaleData, documentId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Programa o Curso Adquirido *
                </label>
                <select
                  value={newSaleData.course}
                  onChange={e => {
                    const c = availableCourses.find(bc => bc.title === e.target.value) || baseCourses.find(bc => bc.title === e.target.value);
                    setNewSaleData({
                      ...newSaleData,
                      course: e.target.value,
                      value: c ? c.price : newSaleData.value,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13.5,
                    background: '#fff',
                    outline: 'none',
                  }}
                >
                  {availableCourses.map(c => (
                    <option key={c.id || c.slug} value={c.title}>
                      {c.title} — {money(c.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Monto Cobrado (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newSaleData.value}
                    onChange={e => setNewSaleData({ ...newSaleData, value: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Método de Pago *
                  </label>
                  <select
                    value={newSaleData.method}
                    onChange={e => setNewSaleData({ ...newSaleData, method: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      background: '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value="Bold">Bold (Pasarela)</option>
                    <option value="PSE">PSE Bancario</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
                    <option value="Consignación Efectivo">Consignación / Efectivo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Estado Inicial *
                  </label>
                  <select
                    value={newSaleData.status}
                    onChange={e => setNewSaleData({ ...newSaleData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      background: '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value="Aprobado">Aprobado (Matrícula activa)</option>
                    <option value="Pendiente">Pendiente (Por verificar)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Fecha de Transacción *
                  </label>
                  <input
                    type="date"
                    required
                    value={newSaleData.date}
                    onChange={e => setNewSaleData({ ...newSaleData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                  <Icon name="check" size={15} /> Guardar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
