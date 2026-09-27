'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/lib/supabase/adminService';
import type { Sale } from '@/lib/types';
import { AdminSalesManager } from '@/components/admin/AdminSalesManager';

export default function AdminSalesPage() {
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSales = useCallback(async () => {
    try {
      const res = await adminService.getSalesHistory();
      setSalesList(res || []);
    } catch (err) {
      console.warn('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();

    // Sincronización reactiva en tiempo real ante compras en la web o cambios de estado
    const handleSalesUpdate = (e: Event) => {
      const custom = e as CustomEvent<Sale[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setSalesList(custom.detail);
      } else {
        loadSales();
      }
    };

    window.addEventListener('eddip_sales_updated', handleSalesUpdate);
    window.addEventListener('storage', handleSalesUpdate);

    return () => {
      window.removeEventListener('eddip_sales_updated', handleSalesUpdate);
      window.removeEventListener('storage', handleSalesUpdate);
    };
  }, [loadSales]);

  const handleUpdateStatus = async (saleId: string, newStatus: string) => {
    setSalesList(prev => prev.map(s => (s.id === saleId ? { ...s, status: newStatus } : s)));
    await adminService.updateSaleStatus(saleId, newStatus);
  };

  const handleAddSale = async (newSale: Sale) => {
    setSalesList(prev => [newSale, ...prev.filter(s => s.id !== newSale.id)]);
    await adminService.recordSale(newSale);
  };

  const handleDeleteSale = async (saleId: string) => {
    setSalesList(prev => prev.filter(s => s.id !== saleId));
    await adminService.deleteSale(saleId);
  };

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Gestión Comercial</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Historial de ventas y pagos</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Consulta las inscripciones adquiridas por pasarelas electrónicas, actualiza estados y exporta reportes financieros.
          </p>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          Cargando registro de ventas y pagos...
        </div>
      ) : (
        <AdminSalesManager
          sales={salesList}
          onUpdateStatus={handleUpdateStatus}
          onAddSale={handleAddSale}
          onDeleteSale={handleDeleteSale}
        />
      )}
    </div>
  );
}
