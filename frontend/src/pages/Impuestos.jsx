import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { RefreshCw, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { impuestosApi } from '../api';
import { LoadingSpinner, ErrorMessage, PageHeader, Monto, Field } from '../components/ui';
import clsx from 'clsx';

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function ImpuestoRow({ anio, mes, dato, onRecalcular, onAgregarNota, onEliminarNota }) {
  const [expandido, setExpandido] = useState(false);
  const [editando, setEditando] = useState(false);
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm({ defaultValues: {
    ivaReal: dato.ivaReal ?? '',
    iraeReal: dato.iraeReal ?? '',
    patrimonioReal: dato.patrimonioReal ?? '',
    bpsReal: dato.bpsReal ?? '',
  }});
  const { register: regNota, handleSubmit: submitNota, reset: resetNota } = useForm();

  const actualizar = useMutation({
    mutationFn: (data) => impuestosApi.actualizar(anio, mes, data),
    onSuccess: () => { qc.invalidateQueries(['impuestos', anio]); setEditando(false); },
  });

  const agregarNota = useMutation({
    mutationFn: ({ texto }) => onAgregarNota(anio, mes, texto),
    onSuccess: () => { qc.invalidateQueries(['impuestos', anio]); resetNota(); },
  });

  const impCtrl = (calc, real) => real ?? calc;

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-800 w-28">{MESES_NOMBRES[mes - 1]}</span>
          <div className="flex gap-6 text-sm">
            <span className="text-gray-500">IVA: <span className="font-medium text-gray-900">
              <Monto value={impCtrl(dato.ivaCalculado, dato.ivaReal)} moneda="UYU" /></span>
            </span>
            <span className="text-gray-500">IRAE: <span className="font-medium text-gray-900">
              <Monto value={impCtrl(dato.iraeCalculado, dato.iraeReal)} moneda="UYU" /></span>
            </span>
            <span className="text-gray-500">BPS: <span className="font-medium text-gray-900">
              <Monto value={impCtrl(dato.bpsCalculado, dato.bpsReal)} moneda="UYU" /></span>
            </span>
            <span className="text-gray-500">Patr.: <span className="font-medium text-gray-900">
              <Monto value={impCtrl(dato.patrimonioCalculado, dato.patrimonioReal)} moneda="UYU" /></span>
            </span>
          </div>
          {dato.notas?.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              {dato.notas.length} nota{dato.notas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onRecalcular(anio, mes); }}
            className="btn-ghost p-1.5 text-gray-400"
            title="Recalcular"
          >
            <RefreshCw size={15} />
          </button>
          {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expandido && (
        <div className="border-t border-gray-200 px-5 py-4 space-y-4">
          {/* Tabla calculados vs reales */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Impuesto</th>
                  <th className="table-header">Calculado</th>
                  <th className="table-header">Real (editado)</th>
                  <th className="table-header">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { label: 'IVA',        calc: dato.ivaCalculado,        real: dato.ivaReal },
                  { label: 'IRAE',       calc: dato.iraeCalculado,       real: dato.iraeReal },
                  { label: 'BPS',        calc: dato.bpsCalculado,        real: dato.bpsReal },
                  { label: 'Patrimonio', calc: dato.patrimonioCalculado, real: dato.patrimonioReal },
                ].map(({ label, calc, real }) => {
                  const diff = real != null ? real - calc : null;
                  return (
                    <tr key={label}>
                      <td className="table-cell font-medium">{label}</td>
                      <td className="table-cell text-gray-500"><Monto value={calc} moneda="UYU" /></td>
                      <td className="table-cell">
                        {real != null
                          ? <span className="font-medium"><Monto value={real} moneda="UYU" /></span>
                          : <span className="text-gray-400 text-xs">sin editar</span>}
                      </td>
                      <td className={clsx('table-cell font-medium text-xs', diff == null ? '' : diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : '')}>
                        {diff != null ? <Monto value={diff} moneda="UYU" /> : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Editar valores reales */}
          {editando ? (
            <form onSubmit={handleSubmit(actualizar.mutate)} className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                {[['ivaReal','IVA'],['iraeReal','IRAE'],['bpsReal','BPS'],['patrimonioReal','Patrimonio']].map(([name, label]) => (
                  <Field key={name} label={label}>
                    <input {...register(name, { valueAsNumber: true })} type="number" step="0.01" className="input text-sm" placeholder="Dejar vacío = calculado" />
                  </Field>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm">Guardar</button>
                <button type="button" className="btn-secondary text-sm" onClick={() => setEditando(false)}>Cancelar</button>
              </div>
            </form>
          ) : (
            <button className="btn-secondary text-sm" onClick={() => setEditando(true)}>Editar valores reales</button>
          )}

          {/* Notas */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Notas de discrepancia</p>
            {dato.notas?.map(n => (
              <div key={n.id} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <p className="text-sm flex-1 text-gray-700">{n.texto}</p>
                <button onClick={() => onEliminarNota(n.id)} className="btn-ghost p-1 text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <form onSubmit={submitNota(d => agregarNota.mutate(d))} className="flex gap-2 mt-2">
              <input {...regNota('texto', { required: true })} className="input text-sm" placeholder="Agregar nota..." />
              <button type="submit" className="btn-secondary text-sm py-1.5 px-3">
                <Plus size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Impuestos() {
  const qc = useQueryClient();
  const anio = new Date().getFullYear();
  const [anioSel, setAnioSel] = useState(anio);

  const { data: datos = [], isLoading, error } = useQuery({
    queryKey: ['impuestos', anioSel],
    queryFn: () => impuestosApi.getAnio(anioSel),
  });

  // Para los meses sin datos aún, mostrar desde enero hasta hoy
  const mesActual = new Date().getMonth() + 1;
  const mesesAMostrar = anioSel < anio
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: mesActual }, (_, i) => i + 1);

  const getMes = (mes) => datos.find(d => d.mes === mes);

  const recalcular = useMutation({
    mutationFn: ({ a, m }) => impuestosApi.recalcular(a, m),
    onSuccess: () => qc.invalidateQueries(['impuestos', anioSel]),
  });

  const agregarNota = (a, m, texto) => impuestosApi.agregarNota(a, m, texto);

  const eliminarNota = useMutation({
    mutationFn: (id) => impuestosApi.eliminarNota(id),
    onSuccess: () => qc.invalidateQueries(['impuestos', anioSel]),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      <PageHeader
        title="Aportes e Impuestos"
        subtitle="IVA, IRAE, BPS y Patrimonio por mes"
        action={
          <select value={anioSel} onChange={e => setAnioSel(Number(e.target.value))} className="input w-auto">
            {[anio - 1, anio, anio + 1].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        }
      />

      <div className="space-y-3">
        {mesesAMostrar.map(mes => {
          const dato = getMes(mes);
          if (!dato) {
            // Fetch on demand para meses sin dato
            return (
              <div key={mes} className="card px-5 py-3 flex items-center justify-between">
                <span className="text-gray-500 text-sm">{MESES_NOMBRES[mes - 1]}</span>
                <button
                  className="btn-secondary text-sm"
                  onClick={() => impuestosApi.getMes(anioSel, mes).then(() => qc.invalidateQueries(['impuestos', anioSel]))}
                >
                  Calcular
                </button>
              </div>
            );
          }
          return (
            <ImpuestoRow
              key={mes}
              anio={anioSel}
              mes={mes}
              dato={dato}
              onRecalcular={(a, m) => recalcular.mutate({ a, m })}
              onAgregarNota={agregarNota}
              onEliminarNota={(id) => eliminarNota.mutate(id)}
            />
          );
        })}
      </div>
    </div>
  );
}
