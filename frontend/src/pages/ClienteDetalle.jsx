// ─────────────────────────────────────────────────────────────
// ClienteDetalle.jsx
// ─────────────────────────────────────────────────────────────
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { clientesApi } from '../api';
import { LoadingSpinner, ErrorMessage, Badge } from '../components/ui';

export function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: c, isLoading, error } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesApi.obtener(id),
  });
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="max-w-3xl space-y-5">
      <button onClick={() => navigate('/clientes')} className="btn-ghost -ml-2"><ArrowLeft size={16} /> Volver</button>
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-1">{c.nombre}</h1>
        <p className="text-sm text-gray-500 mb-4">RUT: {c.rut || '—'}</p>
        {c.descripcion && <p className="text-sm text-gray-700 mb-4">{c.descripcion}</p>}
        <h2 className="section-title mb-3">Referentes</h2>
        {c.referentes?.length === 0 ? (
          <p className="text-sm text-gray-400">Sin referentes</p>
        ) : (
          <div className="space-y-2">
            {c.referentes.map(r => (
              <div key={r.id} className="flex gap-6 py-2 px-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium w-36 truncate">{r.nombre}</span>
                <span className="text-gray-500">{r.mail || '—'}</span>
                <span className="text-gray-500">{r.celular || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card p-6">
        <h2 className="section-title mb-3">Proyectos recientes</h2>
        {c.proyectos?.length === 0 ? (
          <p className="text-sm text-gray-400">Sin proyectos</p>
        ) : (
          <div className="space-y-2">
            {c.proyectos.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{p.nombre}</span>
                <Badge value={p.estado} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClienteDetalle;
