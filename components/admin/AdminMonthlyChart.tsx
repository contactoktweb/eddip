import { money } from '@/lib/data';

type Props = {
  totalSales?: number;
  salesCount?: number;
};

export function AdminMonthlyChart({ totalSales, salesCount }: Props) {
  const currentYear = new Date().getFullYear();
  const heights = [42, 58, 48, 72, 65, 88, 76, 94, 82, 100, 91, 106];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const displayTotal = typeof totalSales === 'number' ? money(totalSales) : '$1.268.600 COP';

  return (
    <section className="dash-card" aria-label="Gráfica de ingresos mensuales">
      <div className="dash-card-head">
        <h2>Ingresos y matrículas</h2>
        <span className="badge">{currentYear}</span>
      </div>

      <div className="chart-caption" style={{ marginBottom: 20 }}>
        <strong style={{ fontSize: 22, color: '#071F49' }}>{displayTotal}</strong>
        <span style={{ color: '#059669', fontSize: 12, fontWeight: 600, marginLeft: 10 }}>
          {salesCount !== undefined ? `${salesCount} transacciones aprobadas` : '18 transacciones aprobadas'}
        </span>
      </div>

      <div className="bars" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
        {heights.map((h, i) => (
          <div
            className="bar-col"
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              className="bar"
              style={{
                height: `${h}px`,
                width: '100%',
                background: i === 11 ? 'linear-gradient(180deg, #0F59DF, #073B9D)' : '#e2e8f0',
                borderRadius: '6px 6px 0 0',
                transition: 'height 0.4s ease, background 0.2s ease',
              }}
              title={`${months[i]}: ~$${Math.round(h * 65000).toLocaleString('es-CO')} COP`}
            />
            <span style={{ fontSize: 10, color: '#64748b' }}>{months[i]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
