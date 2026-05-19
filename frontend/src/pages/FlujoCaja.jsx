import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { flujoCajaApi } from '../api';
import { LoadingSpinner, ErrorMessage, PageHeader, Monto } from '../components/ui';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function FlujoCaja() {
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const [moneda, setMoneda] = useState('UYU');

  const { data, isLoading, error } = useQuery({
    queryKey: ['flujo-caja', anio, moneda],
    queryFn: () => flujoCajaApi.get(anio, moneda),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error)     return <ErrorMessage message={error.message} />;

  const chartData = data?.meses.map(m => ({
    mes: MESES[m.mes - 1],
    Ingresos:   m.ingresos,
    Egresos:   -m.egresos,
    Impuestos: -m.impuestos,
    Acumulado:  m.acumulado,
  })) || [];

  const totales = data?.meses.reduce(
    (acc, m) => ({
      ingresos:   acc.ingresos   + m.ingresos,
      egresos:    acc.egresos    + m.egresos,
      impuestos:  acc.impuestos  + m.impuestos,
      saldo:      acc.saldo      + m.saldo,
    }),
    { ingresos: 0, egresos: 0, impuestos: 0, saldo: 0 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flujo de Caja"
        subtitle="Ingresos, egresos e impuestos por mes"
        action={
          <div className="flex gap-3">
            <select value={moneda} onChange={e => setMoneda(e.target.value)} className="input w-auto">
              <option value="UYU">UYU</option>
              <option value="USD">USD</option>
            </select>
            <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="input w-auto">
              {[anioActual - 2, anioActual - 1, anioActual, anioActual + 1].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Totales anuales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total ingresos',  value: totales.ingresos,  color: 'text-green-700 bg-green-50' },
          { label: 'Total egresos',   value: totales.egresos,   color: 'text-red-700 bg-red-50' },
          { label: 'Total impuestos', value: totales.impuestos, color: 'text-orange-700 bg-orange-50' },
          { label: 'Resultado neto',  value: totales.saldo,
            color: totales.saldo >= 0 ? 'text-indigo-700 bg-indigo-50' : 'text-red-700 bg-red-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">{label}</p>
            <Monto value={Math.abs(value)} moneda={moneda} className="text-xl font-bold" />
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Evolución mensual {anio}</h2>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v.toLocaleString('es-UY')} />
            <Tooltip
              formatter={(v, name) => [`${moneda} ${Math.abs(v).toLocaleString('es-UY')}`, name]}
            />
            <Legend />
            <Bar dataKey="Ingresos"   stackId="a" fill="#4ade80" radius={[0,0,0,0]} />
            <Bar dataKey="Egresos"    stackId="a" fill="#f87171" radius={[0,0,0,0]} />
            <Bar dataKey="Impuestos"  stackId="a" fill="#fb923c" radius={[4,4,0,0]} />
            <Line dataKey="Acumulado" type="monotone" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla detallada */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Mes','Ingresos','Egresos','Impuestos','Saldo','Acumulado'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.meses.map(m => (
              <tr key={m.mes} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{MESES[m.mes - 1]}</td>
                <td className="table-cell text-green-700"><Monto value={m.ingresos} moneda={moneda} /></td>
                <td className="table-cell text-red-600"><Monto value={m.egresos} moneda={moneda} /></td>
                <td className="table-cell text-orange-600"><Monto value={m.impuestos} moneda={moneda} /></td>
                <td className={`table-cell font-medium ${m.saldo >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  <Monto value={m.saldo} moneda={moneda} />
                </td>
                <td className={`table-cell font-semibold ${m.acumulado >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                  <Monto value={m.acumulado} moneda={moneda} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
