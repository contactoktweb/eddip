/** Medios de pago aceptados para registrar ventas manuales desde el panel. */
export const MANUAL_PAYMENT_METHODS = [
  { value: 'Bold', label: 'Bold (Pasarela)' },
  { value: 'PSE', label: 'PSE Bancario' },
  { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito' },
  { value: 'Transferencia Bancolombia', label: 'Transferencia Bancolombia' },
  { value: 'Consignación Efectivo', label: 'Consignación / Efectivo' },
] as const;

export const isManualPaymentMethod = (value: unknown): value is string =>
  typeof value === 'string' && MANUAL_PAYMENT_METHODS.some(m => m.value === value);
