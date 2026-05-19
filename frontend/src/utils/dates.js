import { parseISO, format } from 'date-fns';

// Parsea cualquier ISO string tomando solo la parte YYYY-MM-DD,
// evitando que la conversión UTC→local cambie el día en timezones negativas (ej. Uruguay UTC-3).
function parseDateSafe(dateStr) {
  if (!dateStr) return null;
  const part = typeof dateStr === 'string' ? dateStr.substring(0, 10) : dateStr.toISOString().substring(0, 10);
  return parseISO(part);
}

// Para mostrar fechas en pantalla: dd/MM/yyyy
export function fmtFecha(dateStr) {
  const d = parseDateSafe(dateStr);
  return d ? format(d, 'dd/MM/yyyy') : '—';
}

// Para pre-cargar inputs type="date": yyyy-MM-dd
export function toDateInput(dateStr) {
  const d = parseDateSafe(dateStr);
  return d ? format(d, 'yyyy-MM-dd') : '';
}
