import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Eye, TrendingUp, Trash2 } from 'lucide-react';
import { fmtFecha } from '../utils/dates';
import { useNavigate } from 'react-router-dom';
import { colaboradoresApi } from '../api';
import {
  LoadingSpinner, ErrorMessage, Modal, PageHeader, Field,
  Badge, EmptyState, Monto, ConfirmDialog
} from '../components/ui';

function ColaboradorForm({ onSubmit, isLoading }) {
  const { register, watch, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { tipo: 'EMPLEADO' }
  });
  const tipo = watch('tipo');
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" required>
          <input {...register('nombre', { required: true })} className="input" />
        </Field>
        <Field label="Email">
          <input {...register('mail')} type="email" className="input" />
        </Field>
        <Field label="Tipo" required>
          <select {...register('tipo')} className="input">
            <option value="EMPLEADO">Empleado</option>
            <option value="SOCIO">Socio</option>
          </select>
        </Field>
        <Field label="Fecha de alta" required>
          <input {...register('fechaAlta', { required: true })} type="date" className="input" />
        </Field>
        <Field label="Sueldo actual (UYU)" required>
          <input {...register('sueldoActual', { required: true, valueAsNumber: true })} type="number" className="input" />
        </Field>
        {tipo === 'SOCIO' && (
          <Field label="% Acciones">
            <input {...register('porcentajeAcciones', { valueAsNumber: true })} type="number" step="0.01" max="100" className="input" />
          </Field>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar colaborador'}
        </button>
      </div>
    </form>
  );
}

export default function Colaboradores() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data: colaboradores = [], isLoading, error } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: colaboradoresApi.listar,
  });

  const crear = useMutation({
    mutationFn: colaboradoresApi.crear,
    onSuccess: () => { qc.invalidateQueries(['colaboradores']); setModalOpen(false); },
  });

  const eliminar = useMutation({
    mutationFn: colaboradoresApi.eliminar,
    onSuccess: () => { qc.invalidateQueries(['colaboradores']); setConfirm(null); },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        subtitle={`${colaboradores.length} colaborador${colaboradores.length !== 1 ? 'es' : ''}`}
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nuevo colaborador
          </button>
        }
      />

      {colaboradores.length === 0 ? (
        <EmptyState title="Sin colaboradores" description="Agregá socios y empleados." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre','Email','Tipo','Alta','Sueldo actual','Acciones','',''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {colaboradores.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{c.nombre}</td>
                  <td className="table-cell text-gray-500">{c.mail || '—'}</td>
                  <td className="table-cell"><Badge value={c.tipo} /></td>
                  <td className="table-cell text-gray-500">
                    {fmtFecha(c.fechaAlta)}
                  </td>
                  <td className="table-cell">
                    <Monto value={c.sueldoActual} moneda="UYU" />
                  </td>
                  <td className="table-cell text-gray-500">
                    {c.tipo === 'SOCIO' && c.porcentajeAcciones != null
                      ? `${c.porcentajeAcciones}%`
                      : '—'}
                  </td>
                  <td className="table-cell">
                    <button onClick={() => navigate(`/colaboradores/${c.id}`)} className="btn-ghost p-1.5">
                      <Eye size={16} />
                    </button>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => setConfirm(c)} className="btn-ghost p-1.5 text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo colaborador">
        <ColaboradorForm onSubmit={crear.mutate} isLoading={crear.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => eliminar.mutate(confirm?.id)}
        title="Eliminar colaborador"
        message={`¿Confirmás la eliminación de "${confirm?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
