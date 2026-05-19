import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { colaboradoresApi } from '../api';
import { LoadingSpinner, ErrorMessage, Badge, Modal, Field, Monto } from '../components/ui';
import { useState } from 'react';

export default function ColaboradorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modalSueldo, setModalSueldo] = useState(false);

  const { data: c, isLoading, error } = useQuery({
    queryKey: ['colaborador', id],
    queryFn: () => colaboradoresApi.obtener(id),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { moneda: 'UYU' }
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{c.nombre}</h1>
            <p className="text-sm text-gray-500">{c.mail || '—'}</p>
          </div>
          <Badge value={c.tipo} />
        </div>
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
          <div><p className="text-xs text-gray-500">Alta</p><p className="font-medium text-sm">{format(new Date(c.fechaAlta), 'dd/MM/yyyy')}</p></div>
          <div><p className="text-xs text-gray-500">Sueldo actual</p><Monto value={c.sueldoActual} moneda="UYU" className="font-medium text-sm" /></div>
          {c.tipo === 'SOCIO' && (
            <div><p className="text-xs text-gray-500">% Acciones</p><p className="font-medium text-sm">{c.porcentajeAcciones ?? '—'}%</p></div>
          )}
        </div>
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
                      <td className="table-cell text-gray-500">{format(new Date(s.fechaDesde), 'dd/MM/yyyy')}</td>
                      <td className="table-cell text-gray-500">
                        {s.fechaHasta ? format(new Date(s.fechaHasta), 'dd/MM/yyyy') : <span className="text-green-700 font-medium">Vigente</span>}
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
