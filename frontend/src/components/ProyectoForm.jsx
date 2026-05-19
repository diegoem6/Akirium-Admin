import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { bcuApi } from '../api';
import { Field } from './ui';

const ESTADOS = ['FALTA_COTIZAR', 'FALTA_OC', 'EN_EJECUCION', 'FACTURADO', 'FALTA_COBRAR', 'COBRADO'];

// '' en inputs numéricos opcionales debe llegar como null al backend, no como 0
const nullableNum = z.preprocess(
  v => (v === '' || v === null || v === undefined) ? null : Number(v),
  z.number().nullable().optional()
);
// '' en inputs de fecha debe llegar como null al backend, no como string vacío
const nullableDate = z.preprocess(
  v => (v === '' || v === null || v === undefined) ? null : v,
  z.string().nullable().optional()
);

const schema = z.object({
  nombre:             z.string().min(1, 'Requerido'),
  estado:             z.string(),
  clienteId:          z.coerce.number().min(1, 'Seleccioná un cliente'),
  referenteId:        nullableNum,
  moneda:             z.string(),
  cotizacionDolar:    nullableNum,
  tipoIVA:            z.string(),
  numeroOC:           z.string().optional().nullable(),
  numeroFactura:      z.string().optional().nullable(),
  fechaFacturacion:   nullableDate,
  fechaCobroEfectivo: nullableDate,
  subtotalUSD:        nullableNum,
  subtotalUYU:        nullableNum,
  observacion:        z.string().optional().nullable(),
});

export default function ProyectoForm({ defaultValues, onSubmit, onCancel, clientes, isLoading, submitLabel = 'Guardar proyecto' }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { estado: 'FALTA_COTIZAR', moneda: 'USD', tipoIVA: 'BASICO' },
  });

  const clienteId = watch('clienteId');
  const cliente = clientes.find(c => c.id === parseInt(clienteId));

  useQuery({
    queryKey: ['bcu-cotizacion'],
    queryFn: () => bcuApi.cotizacion(),
    onSuccess: (data) => {
      if (!defaultValues?.cotizacionDolar) {
        setValue('cotizacionDolar', data.venta);
      }
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre" error={errors.nombre?.message} required className="sm:col-span-2">
          <input {...register('nombre')} className="input" placeholder="Nombre del proyecto" />
        </Field>

        <Field label="Estado">
          <select {...register('estado')} className="input">
            {ESTADOS.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
          </select>
        </Field>

        <Field label="Cliente" error={errors.clienteId?.message} required>
          <select {...register('clienteId')} className="input">
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </Field>

        {cliente?.referentes?.length > 0 && (
          <Field label="Solicitante">
            <select {...register('referenteId')} className="input">
              <option value="">Sin solicitante</option>
              {cliente.referentes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </Field>
        )}

        <Field label="Moneda">
          <select {...register('moneda')} className="input">
            <option value="USD">USD</option>
            <option value="UYU">UYU</option>
          </select>
        </Field>

        <Field label="Cotización dólar (BCU)">
          <input {...register('cotizacionDolar')} type="number" step="0.01" className="input" placeholder="Automático desde BCU" />
        </Field>

        <Field label="IVA">
          <select {...register('tipoIVA')} className="input">
            <option value="CERO">0% (exento)</option>
            <option value="BASICO">22%</option>
          </select>
        </Field>

        <Field label="N° Orden de Compra">
          <input {...register('numeroOC')} className="input" placeholder="OC-0001" />
        </Field>

        <Field label="N° Factura">
          <input {...register('numeroFactura')} className="input" placeholder="FAC-0001" />
        </Field>

        <Field label="Fecha de facturación">
          <input {...register('fechaFacturacion')} type="date" className="input" />
        </Field>

        <Field label="Fecha cobro efectivo">
          <input {...register('fechaCobroEfectivo')} type="date" className="input" />
        </Field>

        <Field label="Subtotal USD">
          <input {...register('subtotalUSD')} type="number" step="0.01" className="input" placeholder="0.00" />
        </Field>

        <Field label="Subtotal UYU">
          <input {...register('subtotalUYU')} type="number" step="0.01" className="input" placeholder="0.00" />
        </Field>
      </div>

      <Field label="Observación">
        <textarea {...register('observacion')} className="input min-h-[80px]" placeholder="Notas adicionales..." />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
