'use client';
import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/lib/icons';
import { money } from '@/lib/data';
import { callApi } from '@/lib/supabase/authedFetch';

type OnlineOrder = {
  orderId: string;
  courseTitle: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'voided';
  createdAt: string;
  fulfilled: boolean;
  studentName: string;
  studentEmail: string;
};

const STATUS_LABEL: Record<OnlineOrder['status'], { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'order-status-pending' },
  approved: { label: 'Aprobada', className: 'order-status-approved' },
  rejected: { label: 'Rechazada', className: 'order-status-rejected' },
  voided: { label: 'Anulada', className: 'order-status-rejected' },
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

type Props = {
  onNotify: (message: string) => void;
};

/** Pagos iniciados en Bold. Permite verificar con Bold los que quedaron pendientes. */
export function OnlineOrdersPanel({ onNotify }: Props) {
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await callApi<{ orders?: OnlineOrder[] }>('/api/admin/orders', { cache: 'no-store' });
    setLoading(false);
    if (res.ok && res.data.orders) {
      setOrders(res.data.orders);
      setError(null);
    } else {
      setError(res.data.error || 'No fue posible cargar los pagos en línea.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (orderId: string) => {
    setVerifying(orderId);
    const res = await callApi<{ message?: string }>('/api/admin/orders', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
    setVerifying(null);
    onNotify(res.data.message || res.data.error || 'Verificación completada.');
    await load();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('eddip_sales_updated'));
  };

  return (
    <section className="dash-card online-orders" aria-labelledby="online-orders-title">
      <div className="dash-card-head">
        <h2 id="online-orders-title">Pagos en línea (Bold)</h2>
        <button type="button" className="btn btn-outline" onClick={load} style={{ fontSize: 12, padding: '6px 12px' }}>
          <Icon name="refresh" size={14} /> Actualizar
        </button>
      </div>
      <p className="online-orders-help">
        Cada intento de pago crea una orden. Las pendientes son pagos que no se completaron o que Bold aún no confirma.
      </p>

      {loading ? (
        <p className="table-empty">Cargando pagos…</p>
      ) : error ? (
        <p className="form-submit-error" role="alert">
          <Icon name="alert" size={16} /> {error}
        </p>
      ) : orders.length === 0 ? (
        <p className="table-empty">Aún no hay pagos en línea.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th>Curso</th>
                <th>Valor</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.orderId}>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <span className="table-title">{order.studentName || order.studentEmail}</span>
                    <br />
                    <small style={{ color: '#7a8b9e' }}>{order.studentEmail}</small>
                  </td>
                  <td>{order.courseTitle}</td>
                  <td>{money(order.amount)}</td>
                  <td>
                    <span className={`order-status ${STATUS_LABEL[order.status].className}`}>
                      {STATUS_LABEL[order.status].label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {order.status === 'pending' || (order.status === 'approved' && !order.fulfilled) ? (
                      <button
                        type="button"
                        className="btn btn-soft"
                        style={{ fontSize: 12, padding: '6px 12px' }}
                        onClick={() => verify(order.orderId)}
                        disabled={verifying === order.orderId}
                      >
                        {verifying === order.orderId ? 'Verificando…' : 'Verificar con Bold'}
                      </button>
                    ) : (
                      <small style={{ color: '#7a8b9e' }}>{order.status === 'approved' ? 'Matrícula activa' : 'Sin acción'}</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
