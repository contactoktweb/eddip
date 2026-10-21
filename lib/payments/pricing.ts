/**
 * Becas institucionales. Este módulo lo usan el resumen del checkout y el servidor;
 * el monto que se cobra siempre lo recalcula el servidor con el precio del curso guardado allí.
 */
const SCHOLARSHIP_CODES = ['EDDIP10', 'OFICIAL', 'BECA2026'];
const SCHOLARSHIP_PERCENT = 15;

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase().slice(0, 40);

export function scholarshipPercentFor(code: string): number {
  return SCHOLARSHIP_CODES.includes(normalizeCouponCode(code)) ? SCHOLARSHIP_PERCENT : 0;
}

export function quoteCoursePrice(price: number, couponCode = '') {
  const discountPercent = scholarshipPercentFor(couponCode);
  const discountAmount = Math.round((price * discountPercent) / 100);
  return { discountPercent, discountAmount, total: Math.max(0, price - discountAmount) };
}
