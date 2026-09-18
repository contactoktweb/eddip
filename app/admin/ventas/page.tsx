'use client';
import { useState, useEffect } from 'react';
import { sales as initialSales } from '@/lib/data';
import { adminService } from '@/lib/supabase/adminService';
import type { Sale } from '@/lib/types';
import { AdminSalesManager } from '@/components/admin/AdminSalesManager';

export default function AdminSalesPage() {
  const [salesList, setSalesList] = useState<Sale[]>(initialSales);

  useEffect(() => {
    adminService.getSalesHistory().then(res => {
      if (res && res.length > 0) {
        setSalesList(res);
      }
    });
  }, []);

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Gestión Comercial</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Historial de ventas y pagos</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Consulta las inscripciones adquiridas por pasarelas electrónicas y exporta reportes financieros.
          </p>
        </div>
      </header>

      <AdminSalesManager sales={salesList} />
    </div>
  );
}
