/** Precio en soles: "S/ 20" o "S/ 20.50" si tiene centimos. */
export function soles(monto: number): string {
  return Number.isInteger(monto) ? `S/ ${monto}` : `S/ ${monto.toFixed(2)}`;
}
