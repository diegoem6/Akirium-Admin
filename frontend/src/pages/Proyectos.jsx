import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { fmtFecha } from '../utils/dates';
import { proyectosApi, clientesApi } from '../api';
import {
  LoadingSpinner, ErrorMessage, Modal, Badge, PageHeader,
  EmptyState, Monto, ConfirmDialog
} from '../components/ui';
import ProyectoForm from '../components/ProyectoForm';

const ESTADOS = ['FALTA_COTIZAR','FALTA_OC','EN_EJECUCION','FACTURADO','FALTA_COBRAR','COBRADO'];

export default function Proyectos() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data: proyectos = [], isLoading, error } = useQuery({
    queryKey: ['proyectos', filtroEstado],
    queryFn: () => proyectosApi.listar(filtroEstado ? { estado: filtroEstado } : {}),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.listar,
  });

  const crear = useMutation({
    mutationFn: proyectosApi.crear,
    onSuccess: () => { qc.invalidateQueries(['proyectos']); setModalOpen(false); },
  });

  const eliminar = useMutation({
    mutationFn: proyectosApi.eliminar,
    onSuccess: () => { qc.invalidateQueries(['proyectos']); setConfirm(null); },
  });

  const filtrados = proyectos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.cliente?.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;
  if (error)     return <ErrorMessage message={error.message} />;

  return (
    <div>
      <PageHeader
        title="Proyectos"
        subtitle={`${proyectos.length} proyecto${proyectos.length !== 1 ? 's' : ''}`}
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nuevo proyecto
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input pl-9 w-56"
            placeholder="Buscar..."
          />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input w-auto">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState title="No hay proyectos" description="Creá tu primer proyecto." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Proyecto','Cliente','Estado','Moneda','Total USD','Total UYU','Facturación','',''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-medium">{p.nombre}</td>
                  <td className="table-cell text-gray-600">{p.cliente?.nombre}</td>
                  <td className="table-cell"><Badge value={p.estado} /></td>
                  <td className="table-cell"><Badge value={p.moneda} /></td>
                  <td className="table-cell"><Monto value={p.totalUSD} moneda="USD" /></td>
                  <td className="table-cell"><Monto value={p.totalUYU} moneda="UYU" /></td>
                  <td className="table-cell text-gray-500">
                    {fmtFecha(p.fechaFacturacion)}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => navigate(`/proyectos/${p.id}`)}
                      className="btn-ghost p-1.5"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => setConfirm(p)}
                      className="btn-ghost p-1.5 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo proyecto" size="lg">
        <ProyectoForm
          clientes={clientes}
          onSubmit={crear.mutate}
          isLoading={crear.isPending}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => eliminar.mutate(confirm?.id)}
        title="Eliminar proyecto"
        message={`¿Confirmás la eliminación de "${confirm?.nombre}"? Se borrarán también todos los archivos adjuntos. Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
