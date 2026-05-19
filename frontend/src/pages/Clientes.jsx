import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clientesApi } from '../api';
import { LoadingSpinner, ErrorMessage, Modal, PageHeader, Field, EmptyState, ConfirmDialog } from '../components/ui';

function ClienteForm({ defaultValues, onSubmit, isLoading }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues || { referentes: [] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'referentes' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Nombre" error={errors.nombre?.message} required>
        <input {...register('nombre', { required: 'Requerido' })} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="RUT" error={errors.rut?.message}>
          <input {...register('rut')} className="input" placeholder="21000000001" />
        </Field>
        <Field label="Descripción" error={errors.descripcion?.message}>
          <input {...register('descripcion')} className="input" />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="label mb-0">Referentes</p>
          <button type="button" className="btn-ghost text-xs py-1" onClick={() => append({ nombre: '', mail: '', celular: '' })}>
            <Plus size={14} /> Agregar
          </button>
        </div>
        {fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-4 gap-2 mb-2">
            <input {...register(`referentes.${i}.nombre`)} className="input" placeholder="Nombre" />
            <input {...register(`referentes.${i}.mail`)}   className="input" placeholder="Email" />
            <input {...register(`referentes.${i}.celular`)}className="input" placeholder="Celular" />
            <button type="button" className="btn-ghost text-red-500 px-2" onClick={() => remove(i)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </div>
    </form>
  );
}

export default function Clientes() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data: clientes = [], isLoading, error } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.listar,
  });

  const crear = useMutation({
    mutationFn: clientesApi.crear,
    onSuccess: () => { qc.invalidateQueries(['clientes']); setModalOpen(false); },
  });

  const eliminar = useMutation({
    mutationFn: clientesApi.eliminar,
    onSuccess: () => { qc.invalidateQueries(['clientes']); setConfirm(null); },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`}
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nuevo cliente
          </button>
        }
      />

      {clientes.length === 0 ? (
        <EmptyState title="Sin clientes" description="Agregá tu primer cliente." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'RUT', 'Referentes', 'Proyectos', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{c.nombre}</td>
                  <td className="table-cell text-gray-500">{c.rut || '—'}</td>
                  <td className="table-cell text-gray-500">{c.referentes?.length || 0}</td>
                  <td className="table-cell text-gray-500">{c._count?.proyectos || 0}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/clientes/${c.id}`)} className="btn-ghost p-1.5">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => setConfirm(c.id)} className="btn-ghost p-1.5 text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo cliente" size="lg">
        <ClienteForm onSubmit={crear.mutate} isLoading={crear.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => eliminar.mutate(confirm)}
        title="Eliminar cliente"
        message="¿Eliminás este cliente? Se borrarán también sus referentes."
      />
    </div>
  );
}
