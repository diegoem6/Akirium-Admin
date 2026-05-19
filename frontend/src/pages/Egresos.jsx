import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Upload, Trash2, Pencil } from 'lucide-react';
import { fmtFecha, toDateInput } from '../utils/dates';
import { egresosApi, colaboradoresApi } from '../api';
import {
  LoadingSpinner, ErrorMessage, Modal, PageHeader, Field,
  Badge, EmptyState, Monto, ConfirmDialog
} from '../components/ui';

function EgresoForm({ onSubmit, isLoading, colaboradores, defaultValues }) {
  const { register, handleSubmit } = useForm({
    defaultValues: defaultValues || { tipo: 'EGRESO', moneda: 'UYU', estado: 'PENDIENTE' },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha" required>
          <input {...register('fecha', { required: true })} type="date" className="input" />
        </Field>
        <Field label="Tipo">
          <select {...register('tipo')} className="input">
            <option value="EGRESO">Egreso</option>
            <option value="DEVOLUCION">Devolución</option>
          </select>
        </Field>
        <Field label="Monto" required>
          <input {...register('monto', { required: true, valueAsNumber: true })} type="number" step="0.01" className="input" />
        </Field>
        <Field label="Moneda">
          <select {...register('moneda')} className="input">
            <option value="UYU">UYU</option>
            <option value="USD">USD</option>
          </select>
        </Field>
        <Field label="Estado">
          <select {...register('estado')} className="input">
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADO">Pagado</option>
          </select>
        </Field>
        <Field label="Colaborador">
          <select {...register('colaboradorId', { valueAsNumber: true })} className="input">
            <option value="">Sin colaborador</option>
            {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Descripción" required>
        <textarea {...register('descripcion', { required: true })} className="input min-h-[80px]" />
      </Field>
      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar egreso'}
        </button>
      </div>
    </form>
  );
}

export default function Egresos() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editEgreso, setEditEgreso] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const fileRef = useRef();
  const [uploadTarget, setUploadTarget] = useState(null);

  const { data: egresos = [], isLoading, error } = useQuery({
    queryKey: ['egresos', filtroTipo, filtroEstado],
    queryFn: () => egresosApi.listar({ tipo: filtroTipo || undefined, estado: filtroEstado || undefined }),
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: colaboradoresApi.listar,
  });

  const crear = useMutation({
    mutationFn: egresosApi.crear,
    onSuccess: () => { qc.invalidateQueries(['egresos']); setModalOpen(false); },
  });

  const editar = useMutation({
    mutationFn: ({ id, data }) => egresosApi.actualizar(id, data),
    onSuccess: () => { qc.invalidateQueries(['egresos']); setEditEgreso(null); },
  });

  const eliminar = useMutation({
    mutationFn: egresosApi.eliminar,
    onSuccess: () => { qc.invalidateQueries(['egresos']); setConfirm(null); },
  });

  const subirComprobante = useMutation({
    mutationFn: ({ id, file }) => {
      const fd = new FormData();
      fd.append('archivo', file);
      return egresosApi.subirComprobante(id, fd);
    },
    onSuccess: () => qc.invalidateQueries(['egresos']),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  const totalUYU = egresos.filter(e => e.moneda === 'UYU').reduce((a, e) => a + e.monto, 0);
  const totalUSD = egresos.filter(e => e.moneda === 'USD').reduce((a, e) => a + e.monto, 0);

  return (
    <div>
      <PageHeader
        title="Egresos"
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nuevo egreso
          </button>
        }
      />

      <div className="flex gap-4 mb-4">
        <div className="card px-4 py-3 flex gap-4">
          <div><p className="text-xs text-gray-500">Total UYU</p><Monto value={totalUYU} moneda="UYU" className="font-bold text-red-600" /></div>
          <div><p className="text-xs text-gray-500">Total USD</p><Monto value={totalUSD} moneda="USD" className="font-bold text-red-600" /></div>
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="input w-auto">
          <option value="">Todos los tipos</option>
          <option value="EGRESO">Egresos</option>
          <option value="DEVOLUCION">Devoluciones</option>
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input w-auto">
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="PAGADO">Pagados</option>
        </select>
      </div>

      {egresos.length === 0 ? (
        <EmptyState title="Sin egresos" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha','Descripción','Tipo','Monto','Estado','Colaborador','Comp.','',''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {egresos.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="table-cell text-gray-500">{fmtFecha(e.fecha)}</td>
                  <td className="table-cell max-w-xs truncate">{e.descripcion}</td>
                  <td className="table-cell"><Badge value={e.tipo} /></td>
                  <td className="table-cell font-medium"><Monto value={e.monto} moneda={e.moneda} /></td>
                  <td className="table-cell"><Badge value={e.estado} /></td>
                  <td className="table-cell text-gray-500">{e.colaborador?.nombre || '—'}</td>
                  <td className="table-cell">
                    {e.archivos?.length > 0 ? (
                      <a href={`/uploads/${e.archivos[0].path.split('uploads/')[1]}`} target="_blank"
                        rel="noreferrer" className="text-xs text-indigo-600 hover:underline">Ver</a>
                    ) : (
                      <button
                        className="text-xs text-gray-400 hover:text-indigo-600"
                        onClick={() => { setUploadTarget(e.id); fileRef.current?.click(); }}
                      >
                        <Upload size={14} />
                      </button>
                    )}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => setEditEgreso(e)}
                      className="btn-ghost p-1.5 text-indigo-500"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => setConfirm(e.id)} className="btn-ghost p-1.5 text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && uploadTarget) subirComprobante.mutate({ id: uploadTarget, file });
          e.target.value = '';
        }}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo egreso" size="lg">
        <EgresoForm onSubmit={crear.mutate} isLoading={crear.isPending} colaboradores={colaboradores} />
      </Modal>

      <Modal
        open={!!editEgreso}
        onClose={() => setEditEgreso(null)}
        title="Editar egreso"
        size="lg"
      >
        {editEgreso && (
          <EgresoForm
            key={editEgreso.id}
            defaultValues={{
              fecha:         toDateInput(editEgreso.fecha),
              descripcion:   editEgreso.descripcion,
              tipo:          editEgreso.tipo,
              monto:         editEgreso.monto,
              moneda:        editEgreso.moneda,
              estado:        editEgreso.estado,
              colaboradorId: editEgreso.colaboradorId ?? '',
            }}
            onSubmit={(data) => editar.mutate({ id: editEgreso.id, data })}
            isLoading={editar.isPending}
            colaboradores={colaboradores}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => eliminar.mutate(confirm)}
        title="Eliminar egreso"
        message="¿Eliminás este egreso?"
      />
    </div>
  );
}
