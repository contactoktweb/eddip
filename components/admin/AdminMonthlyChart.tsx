import { money } from '@/lib/data';
import type { Sale } from '@/lib/types';

type Props = {
  sales: Sale[];
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MAX_BAR_HEIGHT = 110;
const MIN_BAR_HEIGHT = 6;

export function AdminMonthlyChart({ sales }: Props) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const approvedThisYear = sales.filter(
    s => s.status === 'Aprobado' && new Date(`${s.date.slice(0, 10)}T12:00:00`).getFullYear() === currentYear
  );

  const monthly = MONTHS.map((_, month) =>
    approvedThisYear
      .filter(s => new Date(`${s.date.slice(0, 10)}T12:00:00`).getMonth() === month)
      .reduce((total, s) => total + s.value, 0)
  );

  const yearTotal = monthly.reduce((a, b) => a + b, 0);
  const maxMonth = Math.max(...monthly, 0);

  return (
    <section className="dash-card" aria-label="Gráfica de ingresos mensuales">
      <div className="dash-card-head">
        <h2>Ingresos y matrículas</h2>
        <span className="badge">{currentYear}</span>
      </div>

      <div className="chart-caption" style={{ marginBottom: 20 }}>
        <strong style={{ fontSize: 22, color: '#071F49' }}>{money(yearTotal)}</strong>
        <span style={{ color: '#059669', fontSize: 12, fontWeight: 600, marginLeft: 10 }}>
          {approvedThisYear.length} {approvedThisYear.length === 1 ? 'venta aprobada' : 'ventas aprobadas'} en {currentYear}
        </span>
      </div>

      {yearTotal === 0 ? (
        <p className="chart-empty">
          Aún no hay ventas aprobadas este año. Las matrículas pagadas por Bold o registradas manualmente aparecerán aquí.
        </p>
      ) : (
        <div className="bars" role="img" aria-label={`Ingresos aprobados por mes en ${currentYear}`}>
          {monthly.map((value, i) => {
            const height = maxMonth > 0 ? Math.max((value / maxMonth) * MAX_BAR_HEIGHT, value > 0 ? MIN_BAR_HEIGHT : 2) : 2;
            return (
              <div className="bar-col" key={MONTHS[i]}>
                <div
                  className={`bar chart-bar ${i === currentMonth ? 'is-current' : ''} ${value === 0 ? 'is-empty' : ''}`}
                  style={{ height: `${height}px` }}
                  title={`${MONTHS[i]}: ${money(value)}`}
                />
                <span>{MONTHS[i]}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
