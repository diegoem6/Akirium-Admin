import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { utilidadesApi } from '../api';
import { LoadingSpinner, ErrorMessage, PageHeader, Monto } from '../components/ui';

function fmt(value, moneda) {
  if (value == null) return <span className="text-gray-400">—</span>;
  const abs = Math.abs(value);
  const neg = value < 0;
  const str = abs.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const prefix = moneda === 'USD' ? 'U$S ' : '$ ';
  return (
    <span className={neg ? 'text-red-600' : ''}>
      {neg ? '-' : ''}{prefix}{str}
    </span>
  );
}

function ResumenMoneda({ label, r, moneda }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Ingresos</span>
          <span className="font-medium text-green-700">{fmt(r.ingresos, moneda)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Egresos</span>
          <span className="font-medium text-red-600">- {fmt(r.egresos, moneda)}</span>
        </div>
        {moneda === 'UYU' && (
          <div className="flex justify-between text-gray-600">
            <span>Impuestos</span>
            <span className="font-medium text-red-600">- {fmt(r.impuestos, moneda)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-gray-200 pt-2 mt-1">
          <span>Utilidad neta</span>
          <span className={r.acumulado >= 0 ? 'text-indigo-700' : 'text-red-700'}>
            {fmt(r.acumulado, moneda)}
          </span>
        </div>
      </div>
    </div>
  );
}

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export default function Utilidades() {
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(0); // 0 = año completo

  const { data, isLoading, error } = useQuery({
    queryKey: ['utilidades', anio, mes],
    queryFn: () => utilidadesApi.get(anio, mes || undefined),
  });

  const subtitulo = mes
    ? `${MESES[mes - 1]} ${anio}`
    : `Año ${anio}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilidades"
        subtitle={`Distribución de utilidades por socio — ${subtitulo}`}
        action={
          <div className="flex gap-2">
            <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="input w-auto">
              {[anioActual - 2, anioActual - 1, anioActual].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select value={mes} onChange={e => setMes(Number(e.target.value))} className="input w-auto">
              <option value={0}>Año completo</option>
              {MESES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        }
      />

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error.message} />}

      {data && (
        <>
          {/* Resumen por moneda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResumenMoneda label="Pesos uruguayos (UYU)" r={data.resumen.UYU} moneda="UYU" />
            <ResumenMoneda label="Dólares (USD)"          r={data.resumen.USD} moneda="USD" />
          </div>

          {/* Distribución por socio */}
          {data.distribucion.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              <p className="font-medium">No hay socios registrados</p>
              <p className="text-sm mt-1">Registrá colaboradores de tipo "Socio" con su porcentaje de acciones</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="section-title">Distribución por socio</h2>
                {data.totalAcciones !== 100 && (
                  <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                    Acciones registradas: {data.totalAcciones}% (falta {(100 - data.totalAcciones).toFixed(2)}%)
                  </span>
                )}
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Socio', '% Acciones', 'Utilidad UYU', 'Utilidad USD'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.distribucion.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-gray-900">{s.nombre}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(s.porcentajeAcciones, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{s.porcentajeAcciones}%</span>
                        </div>
                      </td>
                      <td className="table-cell font-bold text-indigo-700">
                        {fmt(s.utilidadUYU, 'UYU')}
                      </td>
                      <td className="table-cell font-bold text-indigo-700">
                        {fmt(s.utilidadUSD, 'USD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="table-cell font-bold text-gray-700">Total distribuido</td>
                    <td className="table-cell font-bold text-gray-700">{data.totalAcciones}%</td>
                    <td className="table-cell font-bold text-indigo-700">
                      {fmt(
                        parseFloat(data.distribucion.reduce((s, r) => s + r.utilidadUYU, 0).toFixed(2)),
                        'UYU'
                      )}
                    </td>
                    <td className="table-cell font-bold text-indigo-700">
                      {fmt(
                        parseFloat(data.distribucion.reduce((s, r) => s + r.utilidadUSD, 0).toFixed(2)),
                        'USD'
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
