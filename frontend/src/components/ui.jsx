import { X, Loader2, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

// ─── Modal ────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-xl w-full', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Badge de estado ──────────────────────────────────────────
const ESTADO_STYLES = {
  FALTA_COTIZAR: 'bg-gray-100 text-gray-700',
  FALTA_OC:      'bg-yellow-100 text-yellow-800',
  EN_EJECUCION:  'bg-blue-100 text-blue-800',
  FACTURADO:     'bg-indigo-100 text-indigo-800',
  FALTA_COBRAR:  'bg-orange-100 text-orange-800',
  COBRADO:       'bg-emerald-100 text-emerald-800',
  PAGADO:        'bg-green-100 text-green-800',
  PENDIENTE:     'bg-red-100 text-red-800',
  SOCIO:         'bg-purple-100 text-purple-800',
  EMPLEADO:      'bg-cyan-100 text-cyan-800',
};

const ESTADO_LABELS = {
  FALTA_COTIZAR: 'Falta cotizar',
  FALTA_OC:      'Falta OC',
  EN_EJECUCION:  'En ejecución',
  FACTURADO:     'Facturado',
  FALTA_COBRAR:  'Falta cobrar',
  COBRADO:       'Cobrado',
  PAGADO:        'Pagado',
  PENDIENTE:     'Pendiente',
  SOCIO:         'Socio',
  EMPLEADO:      'Empleado',
  EGRESO:        'Egreso',
  DEVOLUCION:    'Devolución',
  USD:           'USD',
  UYU:           'UYU',
};

export function Badge({ value }) {
  return (
    <span className={clsx('badge', ESTADO_STYLES[value] || 'bg-gray-100 text-gray-700')}>
      {ESTADO_LABELS[value] || value}
    </span>
  );
}

// ─── Loading / Error states ───────────────────────────────────
export function LoadingSpinner({ text = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
      <Loader2 size={24} className="animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
      <AlertCircle size={20} className="shrink-0" />
      <p className="text-sm">{message || 'Ocurrió un error inesperado'}</p>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────
export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">📭</span>
      </div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green:  'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    blue:   'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={clsx('rounded-xl p-4', colors[color])}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>Confirmar</button>
      </div>
    </Modal>
  );
}

// ─── Form Field ───────────────────────────────────────────────
export function Field({ label, error, children, required }) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Moneda formateada ────────────────────────────────────────
export function Monto({ value, moneda = 'UYU', className }) {
  if (value == null || value === '') return <span className="text-gray-400">—</span>;
  const formatted = new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return <span className={className}>{formatted}</span>;
}
