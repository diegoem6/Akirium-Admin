import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Trash2, FileText, Pencil, AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import { proyectosApi, clientesApi } from '../api';
import { LoadingSpinner, ErrorMessage, Badge, Monto, ConfirmDialog } from '../components/ui';
import ProyectoForm from '../components/ProyectoForm';
import { fmtFecha, toDateInput } from '../utils/dates';

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef();
  const [tipoArchivo, setTipoArchivo] = useState('COTIZACION');
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [confirmEliminarProyecto, setConfirmEliminarProyecto] = useState(false);

  const { data: p, isLoading, error } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: () => proyectosApi.obtener(id),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.listar,
  });

  const eliminar = useMutation({
    mutationFn: () => proyectosApi.eliminar(id),
    onSuccess: () => navigate('/proyectos', { replace: true }),
  });

  const actualizar = useMutation({
    mutationFn: (data) => proyectosApi.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['proyecto', id]);
      qc.invalidateQueries(['proyectos']);
      setEditMode(false);
    },
  });

  const subirArchivo = useMutation({
    mutationFn: ({ file }) => {
      const fd = new FormData();
      fd.append('archivo', file);
      fd.append('tipo', tipoArchivo);
      return proyectosApi.subirArchivo(id, fd);
    },
    onSuccess: () => qc.invalidateQueries(['proyecto', id]),
  });

  const eliminarArchivo = useMutation({
    mutationFn: (archivoId) => proyectosApi.eliminarArchivo(id, archivoId),
    onSuccess: () => { qc.invalidateQueries(['proyecto', id]); setConfirmEliminar(null); },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error)     return <ErrorMessage message={error.message} />;

  const editDefaults = {
    nombre:             p.nombre,
    estado:             p.estado,
    clienteId:          p.clienteId,
    referenteId:        p.referenteId ?? '',
    moneda:             p.moneda,
    cotizacionDolar:    p.cotizacionDolar ?? '',
    tipoIVA:            p.tipoIVA,
    numeroOC:           p.numeroOC ?? '',
    numeroFactura:      p.numeroFactura ?? '',
    fechaFacturacion:   toDateInput(p.fechaFacturacion),
    fechaCobroEfectivo: toDateInput(p.fechaCobroEfectivo),
    subtotalUSD:        p.subtotalUSD ?? '',
    subtotalUYU:        p.subtotalUYU ?? '',
    observacion:        p.observacion ?? '',
  };

  return (
    <div className="max-w-4xl space-y-6">
      <button onClick={() => navigate('/proyectos')} className="btn-ghost -ml-2">
        <ArrowLeft size={16} /> Volver
      </button>

      {editMode ? (
        <div className="card p-6">
          <h2 className="section-title mb-5">Editar proyecto</h2>
          <ProyectoForm
            key={p.id}
            defaultValues={editDefaults}
            clientes={clientes}
            onSubmit={actualizar.mutate}
            onCancel={() => setEditMode(false)}
            isLoading={actualizar.isPending}
            submitLabel="Guardar cambios"
          />
          {actualizar.error && (
            <p className="text-sm text-red-600 mt-3">{actualizar.error.message}</p>
          )}
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{p.nombre}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{p.cliente?.nombre}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge value={p.estado} />
              <button onClick={() => setEditMode(true)} className="btn-secondary">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => setConfirmEliminarProyecto(true)} className="btn-danger">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-gray-100">
            <div><p className="text-xs text-gray-500">N° OC</p><p className="font-medium text-sm">{p.numeroOC || '—'}</p></div>
            <div><p className="text-xs text-gray-500">N° Factura</p><p className="font-medium text-sm">{p.numeroFactura || '—'}</p></div>
            <div><p className="text-xs text-gray-500">IVA</p><p className="font-medium text-sm">{p.tipoIVA === 'BASICO' ? '22%' : '0%'}</p></div>
            <div><p className="text-xs text-gray-500">Cotización USD</p><p className="font-medium text-sm">{p.cotizacionDolar ? `$${p.cotizacionDolar}` : '—'}</p></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-gray-100">
            <div><p className="text-xs text-gray-500">Subtotal USD</p><Monto value={p.subtotalUSD} moneda="USD" className="font-medium text-sm" /></div>
            <div><p className="text-xs text-gray-500">IVA USD</p><Monto value={p.ivaUSD} moneda="USD" className="font-medium text-sm" /></div>
            <div><p className="text-xs text-gray-500">Total USD</p><Monto value={p.totalUSD} moneda="USD" className="font-bold text-sm text-indigo-700" /></div>
            <div />
            <div><p className="text-xs text-gray-500">Subtotal UYU</p><Monto value={p.subtotalUYU} moneda="UYU" className="font-medium text-sm" /></div>
            <div><p className="text-xs text-gray-500">IVA UYU</p><Monto value={p.ivaUYU} moneda="UYU" className="font-medium text-sm" /></div>
            <div><p className="text-xs text-gray-500">Total UYU</p><Monto value={p.totalUYU} moneda="UYU" className="font-bold text-sm text-indigo-700" /></div>
            <div />
          </div>

          <div className="grid grid-cols-3 gap-4 py-4">
            <div><p className="text-xs text-gray-500">Facturación</p><p className="font-medium text-sm">{fmtFecha(p.fechaFacturacion)}</p></div>
            <div><p className="text-xs text-gray-500">Posible cobro</p><p className="font-medium text-sm">{fmtFecha(p.fechaPosibleCobro)}</p></div>
            <div><p className="text-xs text-gray-500">Cobro efectivo</p><p className="font-medium text-sm">{fmtFecha(p.fechaCobroEfectivo)}</p></div>
          </div>

          {p.observacion && (
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <p className="text-xs text-gray-500 mb-1">Observación</p>
              <p className="text-sm">{p.observacion}</p>
            </div>
          )}
        </div>
      )}

      {/* Archivos adjuntos */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Archivos adjuntos</h2>

        <div className="flex gap-3 mb-4">
          <select value={tipoArchivo} onChange={e => setTipoArchivo(e.target.value)} className="input w-auto">
            <option value="COTIZACION">Cotización</option>
            <option value="ORDEN_COMPRA">Orden de compra</option>
            <option value="FACTURA">Factura</option>
          </select>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Subir archivo
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) subirArchivo.mutate({ file });
              e.target.value = '';
            }}
          />
        </div>

        {p.archivos?.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Sin archivos adjuntos</p>
        ) : (
          <div className="space-y-2">
            {p.archivos.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.nombre}</p>
                    <p className="text-xs text-gray-400">{a.tipo.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`/uploads/${a.path.split('uploads/')[1]}`} target="_blank" rel="noreferrer"
                    className="btn-ghost text-xs py-1 px-2">Ver</a>
                  <button onClick={() => setConfirmEliminar(a.id)} className="btn-ghost p-1.5 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmEliminar}
        onClose={() => setConfirmEliminar(null)}
        onConfirm={() => eliminarArchivo.mutate(confirmEliminar)}
        title="Eliminar archivo"
        message="¿Confirmás la eliminación del archivo? Esta acción no se puede deshacer."
      />

      <ConfirmDialog
        open={confirmEliminarProyecto}
        onClose={() => setConfirmEliminarProyecto(false)}
        onConfirm={() => eliminar.mutate()}
        title="Eliminar proyecto"
        message={`¿Confirmás la eliminación de "${p.nombre}"? Se borrarán también todos los archivos adjuntos. Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
