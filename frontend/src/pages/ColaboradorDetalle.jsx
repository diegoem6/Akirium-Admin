import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { fmtFecha, toDateInput } from '../utils/dates';
import { colaboradoresApi } from '../api';
import { LoadingSpinner, ErrorMessage, Badge, Modal, Field, Monto } from '../components/ui';
import { useState } from 'react';

export default function ColaboradorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modalSueldo, setModalSueldo] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { data: c, isLoading, error } = useQuery({
    queryKey: ['colaborador', id],
    queryFn: () => colaboradoresApi.obtener(id),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { moneda: 'UYU' }
  });

  const { register: regEdit, handleSubmit: handleEdit, watch: watchEdit } = useForm();

  const actualizar = useMutation({
    mutationFn: (data) => colaboradoresApi.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['colaborador', id]);
      qc.invalidateQueries(['colaboradores']);
      setEditMode(false);
    },
  });

  const registrarSueldo = useMutation({
    mutationFn: (data) => colaboradoresApi.registrarSueldo(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['colaborador', id]);
      setModalSueldo(false);
      reset();
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="max-w-3xl space-y-5">
      <button onClick={() => navigate('/colaboradores')} className="btn-ghost -ml-2">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="card p-6">
        {editMode ? (
          <>
            <h2 className="section-title mb-5">Editar colaborador</h2>
            <form
              key={c.id}
              onSubmit={handleEdit((data) => actualizar.mutate({
                ...data,
                sueldoActual:        parseFloat(data.sueldoActual),
                porcentajeAcciones:  data.porcentajeAcciones ? parseFloat(data.porcentajeAcciones) : null,
              }))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre" required>
                  <input {...regEdit('nombre', { required: true })} defaultValue={c.nombre} className="input" />
                </Field>
                <Field label="Email">
                  <input {...regEdit('mail')} defaultValue={c.mail ?? ''} type="email" className="input" />
                </Field>
                <Field label="Tipo">
                  <select {...regEdit('tipo')} defaultValue={c.tipo} className="input">
                    <option value="EMPLEADO">Empleado</option>
                    <option value="SOCIO">Socio</option>
                  </select>
                </Field>
                <Field label="Fecha de alta">
                  <input
                    {...regEdit('fechaAlta')}
                    defaultValue={toDateInput(c.fechaAlta)}
                    type="date"
                    className="input"
                  />
                </Field>
                <Field label="Sueldo actual (UYU)">
                  <input {...regEdit('sueldoActual')} defaultValue={c.sueldoActual} type="number" className="input" />
                </Field>
                {watchEdit('tipo', c.tipo) === 'SOCIO' && (
                  <Field label="% Acciones">
                    <input {...regEdit('porcentajeAcciones')} defaultValue={c.porcentajeAcciones ?? ''} type="number" step="0.01" max="100" className="input" />
                  </Field>
                )}
              </div>
              {actualizar.error && (
                <p className="text-sm text-red-600">{actualizar.error.message}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={actualizar.isPending}>
                  {actualizar.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold">{c.nombre}</h1>
                <p className="text-sm text-gray-500">{c.mail || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge value={c.tipo} />
                <button onClick={() => setEditMode(true)} className="btn-secondary">
                  <Pencil size={14} /> Editar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
              <div><p className="text-xs text-gray-500">Alta</p><p className="font-medium text-sm">{fmtFecha(c.fechaAlta)}</p></div>
              <div><p className="text-xs text-gray-500">Sueldo actual</p><Monto value={c.sueldoActual} moneda="UYU" className="font-medium text-sm" /></div>
              {c.tipo === 'SOCIO' && (
                <div><p className="text-xs text-gray-500">% Acciones</p><p className="font-medium text-sm">{c.porcentajeAcciones ?? '—'}%</p></div>
              )}
            </div>
          </>
        )}
      </div>

      {c.tipo === 'EMPLEADO' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Historial de sueldos</h2>
            <button className="btn-secondary text-sm" onClick={() => setModalSueldo(true)}>
              <Plus size={14} /> Nuevo sueldo
            </button>
          </div>
          {c.historialSueldos?.length === 0 ? (
            <p className="text-sm text-gray-400">Sin historial</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Sueldo','Moneda','Desde','Hasta','Motivo'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {c.historialSueldos.map(s => (
                    <tr key={s.id} className={s.fechaHasta ? '' : 'bg-green-50'}>
                      <td className="table-cell font-medium">
                        <Monto value={s.sueldo} moneda={s.moneda} />
                      </td>
                      <td className="table-cell"><Badge value={s.moneda} /></td>
                      <td className="table-cell text-gray-500">{fmtFecha(s.fechaDesde)}</td>
                      <td className="table-cell text-gray-500">
                        {s.fechaHasta ? fmtFecha(s.fechaHasta) : <span className="text-green-700 font-medium">Vigente</span>}
                      </td>
                      <td className="table-cell text-gray-500">{s.motivo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modalSueldo} onClose={() => setModalSueldo(false)} title="Registrar nuevo sueldo" size="sm">
        <form onSubmit={handleSubmit(registrarSueldo.mutate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sueldo" required>
              <input {...register('sueldo', { required: true, valueAsNumber: true })} type="number" className="input" />
            </Field>
            <Field label="Moneda">
              <select {...register('moneda')} className="input">
                <option value="UYU">UYU</option>
                <option value="USD">USD</option>
              </select>
            </Field>
          </div>
          <Field label="Fecha desde" required>
            <input {...register('fechaDesde', { required: true })} type="date" className="input" />
          </Field>
          <Field label="Motivo">
            <input {...register('motivo')} className="input" placeholder="Aumento por desempeño..." />
          </Field>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={registrarSueldo.isPending}>
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
