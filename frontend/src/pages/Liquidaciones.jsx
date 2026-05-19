import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ChevronDown, ChevronUp, Pencil, CheckCircle2, RotateCcw } from 'lucide-react';
import { liquidacionesApi } from '../api';
import { LoadingSpinner, ErrorMessage, PageHeader, Field } from '../components/ui';
import clsx from 'clsx';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function fmt(value) {
  if (value == null || value === 0) return <span className="text-gray-400">—</span>;
  return <span>$ {value.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>;
}

function Diff({ calc, real }) {
  if (real == null) return <span className="text-gray-400 text-xs">—</span>;
  const d = real - calc;
  return (
    <span className={clsx('text-xs font-medium', d > 0 ? 'text-red-600' : d < 0 ? 'text-green-600' : 'text-gray-500')}>
      {d >= 0 ? '+' : ''}{d.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </span>
  );
}

function FilaEmpleado({ l, anio, mes }) {
  const qc = useQueryClient();
  const [expandido, setExpandido] = useState(false);
  const [editando, setEditando] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      brutoReal:    l.brutoReal    ?? '',
      bpsReal:      l.bpsReal      ?? '',
      irpfReal:     l.irpfReal     ?? '',
      netoReal:     l.netoReal     ?? '',
      patronalReal: l.patronalReal ?? '',
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['liquidaciones', anio, mes] });

  const actualizar = useMutation({
    mutationFn: (data) => {
      // Convertir strings vacíos a null
      const clean = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === '' ? null : parseFloat(v)])
      );
      return liquidacionesApi.actualizar(anio, mes, l.colaboradorId, clean);
    },
    onSuccess: () => { invalidate(); setEditando(false); },
  });

  const pagar = useMutation({
    mutationFn: () => liquidacionesApi.pagar(anio, mes, l.colaboradorId),
    onSuccess: () => invalidate(),
  });

  const revertir = useMutation({
    mutationFn: () => liquidacionesApi.revertirPago(anio, mes, l.colaboradorId),
    onSuccess: () => invalidate(),
  });

  const tieneOverrides = [l.brutoReal, l.bpsReal, l.irpfReal, l.netoReal, l.patronalReal].some(v => v != null);

  return (
    <>
      {/* Fila principal */}
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpandido(v => !v)}
      >
        <td className="table-cell">
          <div className="flex items-center gap-2">
            <div>
              <p className="font-medium text-gray-900">{l.nombre}</p>
              {l.mail && <p className="text-xs text-gray-400">{l.mail}</p>}
            </div>
            {tieneOverrides && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">editado</span>
            )}
          </div>
        </td>
        <td className="table-cell font-medium">{fmt(l.bruto)}</td>
        <td className="table-cell text-red-600">{fmt(l.empleado.totalBps)}</td>
        <td className="table-cell text-red-600">{fmt(l.empleado.irpf)}</td>
        <td className="table-cell font-semibold text-red-700">{fmt(l.empleado.totalDescuentos)}</td>
        <td className="table-cell font-bold text-green-700">{fmt(l.neto)}</td>
        <td className="table-cell text-orange-600">{fmt(l.patronal.totalPatronal)}</td>
        <td className="table-cell font-semibold text-indigo-700">{fmt(l.costoTotal)}</td>
        <td className="table-cell" onClick={e => e.stopPropagation()}>
          {l.pagado ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-xs font-medium text-green-700">Pagado</span>
            </div>
          ) : (
            <button
              onClick={() => pagar.mutate()}
              disabled={pagar.isPending}
              className="btn-primary text-xs py-1 px-3"
            >
              {pagar.isPending ? '...' : 'Pagar'}
            </button>
          )}
        </td>
        <td className="table-cell text-gray-400">
          {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {/* Fila expandida */}
      {expandido && (
        <tr className="bg-indigo-50/40">
          <td colSpan={10} className="px-5 py-4 space-y-4">
            {/* Tabla calculado vs real */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Descuentos empleado</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Jubilación BPS (15%)</span>{fmt(l.empleado.jubilacion)}</div>
                  <div className="flex justify-between"><span>FONASA (3%)</span>{fmt(l.empleado.fonasa)}</div>
                  <div className="flex justify-between"><span>FRL (0.1%)</span>{fmt(l.empleado.frl)}</div>
                  <div className="flex justify-between font-medium border-t border-indigo-200 pt-1 mt-1">
                    <span>Total BPS</span>{fmt(l.empleado.totalBps)}
                  </div>
                  <div className="flex justify-between"><span>IRPF</span>{fmt(l.empleado.irpf)}</div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Aportes patronales</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Jubilación (7.5%)</span>{fmt(l.patronal.jubilacion)}</div>
                  <div className="flex justify-between"><span>FONASA (5%)</span>{fmt(l.patronal.fonasa)}</div>
                  <div className="flex justify-between"><span>FEGA (0.025%)</span>{fmt(l.patronal.fega)}</div>
                  <div className="flex justify-between"><span>FRL (0.1%)</span>{fmt(l.patronal.frl)}</div>
                  <div className="flex justify-between font-medium border-t border-indigo-200 pt-1 mt-1">
                    <span>Total patronal</span>{fmt(l.patronal.totalPatronal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla calculado vs real */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Concepto','Calculado','Real (editado)','Diferencia'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Sueldo bruto',     calc: l.calculado.bruto,    real: l.brutoReal },
                    { label: 'BPS empleado',      calc: l.calculado.bps,      real: l.bpsReal },
                    { label: 'IRPF',              calc: l.calculado.irpf,     real: l.irpfReal },
                    { label: 'Neto a pagar',      calc: l.calculado.neto,     real: l.netoReal },
                    { label: 'Aportes patronales',calc: l.calculado.patronal, real: l.patronalReal },
                  ].map(({ label, calc, real }) => (
                    <tr key={label}>
                      <td className="table-cell font-medium">{label}</td>
                      <td className="table-cell text-gray-500">{fmt(calc)}</td>
                      <td className="table-cell">
                        {real != null
                          ? <span className="font-medium">{fmt(real)}</span>
                          : <span className="text-gray-400 text-xs">sin editar</span>}
                      </td>
                      <td className="table-cell"><Diff calc={calc} real={real} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Editar valores reales */}
            {editando ? (
              <form onSubmit={handleSubmit(d => actualizar.mutate(d))} className="space-y-3">
                <div className="grid grid-cols-5 gap-3">
                  {[
                    ['brutoReal',    'Sueldo bruto'],
                    ['bpsReal',      'BPS empleado'],
                    ['irpfReal',     'IRPF'],
                    ['netoReal',     'Neto a pagar'],
                    ['patronalReal', 'Patronal'],
                  ].map(([name, label]) => (
                    <Field key={name} label={label}>
                      <input
                        {...register(name)}
                        type="number"
                        step="0.01"
                        className="input text-sm"
                        placeholder="Calculado"
                      />
                    </Field>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Dejar vacío = usar valor calculado</p>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm" disabled={actualizar.isPending}>
                    Guardar
                  </button>
                  <button type="button" className="btn-secondary text-sm" onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <button className="btn-secondary text-sm" onClick={() => setEditando(true)}>
                  <Pencil size={13} /> Editar valores reales
                </button>
                {l.pagado && (
                  <button
                    className="btn-ghost text-xs text-red-500"
                    onClick={() => revertir.mutate()}
                    disabled={revertir.isPending}
                  >
                    <RotateCcw size={13} /> Revertir pago
                  </button>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function Liquidaciones() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes,  setMes]  = useState(hoy.getMonth() + 1);
  const anioActual = hoy.getFullYear();

  const { data, isLoading, error } = useQuery({
    queryKey: ['liquidaciones', anio, mes],
    queryFn: () => liquidacionesApi.get(anio, mes),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liquidaciones"
        subtitle="Sueldos y aportes mensuales de empleados"
        action={
          <div className="flex gap-3">
            <select value={mes} onChange={e => setMes(Number(e.target.value))} className="input w-auto">
              {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="input w-auto">
              {[anioActual - 2, anioActual - 1, anioActual].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        }
      />

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {data && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total bruto',         value: data.totales.bruto,           color: 'bg-gray-50 text-gray-800' },
              { label: 'Neto a pagar',         value: data.totales.neto,            color: 'bg-green-50 text-green-800' },
              { label: 'BPS + IRPF',           value: data.totales.totalDescuentos, color: 'bg-red-50 text-red-800' },
              { label: 'Costo total empresa',  value: data.totales.costoTotal,      color: 'bg-indigo-50 text-indigo-800' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-4 ${color}`}>
                <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">{label}</p>
                <p className="text-xl font-bold">
                  $ {value.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            ))}
          </div>

          {data.liquidaciones.length === 0 ? (
            <div className="card p-12 text-center text-gray-400">
              <p className="font-medium">Sin empleados activos en {MESES[mes - 1]} {anio}</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Empleado','Sueldo bruto','BPS empleado','IRPF','Total descuentos','Neto a pagar','Aportes patronales','Costo empresa','Pago',''].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.liquidaciones.map(l => (
                    <FilaEmpleado
                      key={l.colaboradorId}
                      l={l}
                      anio={anio}
                      mes={mes}
                    />
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="table-cell font-bold text-gray-700">
                      Total ({data.liquidaciones.length} empleado{data.liquidaciones.length !== 1 ? 's' : ''})
                    </td>
                    <td className="table-cell font-bold">{fmt(data.totales.bruto)}</td>
                    <td className="table-cell font-bold text-red-600">{fmt(data.totales.totalBps)}</td>
                    <td className="table-cell font-bold text-red-600">{fmt(data.totales.irpf)}</td>
                    <td className="table-cell font-bold text-red-700">{fmt(data.totales.totalDescuentos)}</td>
                    <td className="table-cell font-bold text-green-700">{fmt(data.totales.neto)}</td>
                    <td className="table-cell font-bold text-orange-600">{fmt(data.totales.totalPatronal)}</td>
                    <td className="table-cell font-bold text-indigo-700">{fmt(data.totales.costoTotal)}</td>
                    <td className="table-cell" />
                    <td className="table-cell" />
                  </tr>
                </tfoot>
              </table>
              <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
                Tasas: BPS empleado 18.1% · BPS patronal 12.625% · IRPF progresivo (BPC 2025 ≈ $6,556). Hacé clic en una fila para ver el desglose.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
