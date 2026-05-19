import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { fmtFecha } from '../utils/dates';
import { dashboardApi } from '../api';
import { LoadingSpinner, ErrorMessage, StatCard, Badge, Monto } from '../components/ui';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatMesLabel(key) {
  const [anio, mes] = key.split('-');
  return MESES[parseInt(mes) - 1];
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 1000 * 60 * 5, // refresh cada 5 min
  });

  if (isLoading) return <LoadingSpinner />;
  if (error)     return <ErrorMessage message={error.message} />;

  const { proyectosPorEstado, facturacion6Meses, kpis, proximosCobros } = data;

  const chartData = facturacion6Meses.map(m => ({
    mes: formatMesLabel(m.mes),
    USD: m.totalUSD,
    UYU: m.totalUYU / 1000, // en miles para escala
  }));

  return (
    <div className="space-y-6">
      <h1 className="page-title">Dashboard</h1>

      {/* ── KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Proyectos totales"  value={kpis.totalProyectos}     color="indigo" />
        <StatCard label="En ejecución"       value={kpis.proyectosEnEjecucion} color="blue" />
        <StatCard label="Clientes activos"   value={kpis.totalClientes}       color="purple" />
        <StatCard label="Pendiente cobro USD" value={
          <Monto value={kpis.montoPendienteUSD} moneda="USD" />
        } color="orange" />
        <StatCard label="Pendiente cobro UYU" value={
          <Monto value={kpis.montoPendienteUYU} moneda="UYU" />
        } color="orange" />
      </div>

      {/* ── Estado de proyectos ───────────────────────────── */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Estado de proyectos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(proyectosPorEstado).map(([estado, count]) => (
            <div key={estado} className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-gray-900 mb-1">{count}</p>
              <Badge value={estado} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Gráfico facturación ───────────────────────────── */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Facturación — últimos 6 meses</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(v, name) => name === 'UYU'
                ? [`$${(v * 1000).toLocaleString('es-UY')}`, 'UYU']
                : [`U$S ${v.toLocaleString('es-UY')}`, 'USD']
              }
            />
            <Legend />
            <Bar dataKey="USD" name="USD" fill="#6366f1" radius={[4,4,0,0]} />
            <Bar dataKey="UYU" name="UYU (miles)" fill="#a5b4fc" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Próximos cobros ───────────────────────────────── */}
      {proximosCobros?.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-3">Próximos cobros (30 días)</h2>
          <div className="space-y-2">
            {proximosCobros.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                  <p className="text-xs text-gray-500">{p.cliente?.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">
                    {fmtFecha(p.fechaPosibleCobro)}
                  </p>
                  <Monto
                    value={p.totalUSD || p.totalUYU}
                    moneda={p.totalUSD ? 'USD' : 'UYU'}
                    className="text-xs text-gray-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
