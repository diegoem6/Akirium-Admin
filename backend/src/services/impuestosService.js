const prisma = require('../lib/prisma');

/**
 * Tasas impositivas Uruguay (valores aproximados, editables en la app)
 */
const TASAS = {
  IVA_BASICO:   0.22,
  IRAE:         0.25,   // 25% sobre renta neta
  PATRIMONIO:   0.015,  // 1.5% sobre patrimonio (simplificado)
  BPS_PATRONAL: 0.075,  // 7.5% sobre nómina
};

/**
 * Calcula el IVA a pagar en un mes dado.
 * IVA débito (ventas gravadas) - IVA crédito (compras con IVA).
 * Simplificación: IVA = suma de IVA en proyectos facturados ese mes.
 */
async function calcularIVA(anio, mes) {
  const { inicio, fin } = rangoMes(anio, mes);

  const proyectos = await prisma.proyecto.findMany({
    where: {
      fechaFacturacion: { gte: inicio, lt: fin },
      tipoIVA: 'BASICO',
      estado: { in: ['FACTURADO', 'FALTA_COBRAR'] },
    },
  });

  let ivaUYU = 0;
  for (const p of proyectos) {
    const base = p.subtotalUYU ?? (p.subtotalUSD && p.cotizacionDolar ? p.subtotalUSD * p.cotizacionDolar : 0);
    ivaUYU += base * TASAS.IVA_BASICO;
  }

  return parseFloat(ivaUYU.toFixed(2));
}

/**
 * IRAE: 25% sobre la renta neta del mes.
 * Renta neta = ingresos facturados - egresos del mes.
 */
async function calcularIRAE(anio, mes) {
  const { inicio, fin } = rangoMes(anio, mes);

  const [proyectos, egresos] = await Promise.all([
    prisma.proyecto.findMany({
      where: {
        fechaFacturacion: { gte: inicio, lt: fin },
        estado: { in: ['FACTURADO', 'FALTA_COBRAR'] },
      },
    }),
    prisma.egreso.findMany({
      where: { fecha: { gte: inicio, lt: fin }, tipo: 'EGRESO' },
    }),
  ]);

  const ingresos = proyectos.reduce((acc, p) => {
    const base = p.subtotalUYU ?? (p.subtotalUSD && p.cotizacionDolar ? p.subtotalUSD * p.cotizacionDolar : 0);
    return acc + (base || 0);
  }, 0);

  const gastos = egresos.reduce((acc, e) => {
    const monto = e.moneda === 'USD' ? 0 : e.monto; // simplificado: solo UYU
    return acc + monto;
  }, 0);

  const rentaNeta = Math.max(ingresos - gastos, 0);
  return parseFloat((rentaNeta * TASAS.IRAE).toFixed(2));
}

/**
 * BPS Patronal: 7.5% sobre la nómina del mes (sueldos de empleados).
 */
async function calcularBPS(anio, mes) {
  const { inicio, fin } = rangoMes(anio, mes);

  // Obtener empleados activos (fechaAlta <= fin del mes)
  const empleados = await prisma.colaborador.findMany({
    where: { tipo: 'EMPLEADO', fechaAlta: { lte: fin } },
    include: {
      historialSueldos: {
        where: { fechaDesde: { lte: fin }, OR: [{ fechaHasta: null }, { fechaHasta: { gte: inicio } }] },
        orderBy: { fechaDesde: 'desc' },
        take: 1,
      },
    },
  });

  const nomina = empleados.reduce((acc, e) => {
    const sueldo = e.historialSueldos[0]?.sueldo ?? e.sueldoActual;
    return acc + sueldo;
  }, 0);

  return parseFloat((nomina * TASAS.BPS_PATRONAL).toFixed(2));
}

/**
 * Patrimonio: simplificado como % del total facturado acumulado del año.
 * En la práctica es más complejo; la app permite sobreescribirlo.
 */
async function calcularPatrimonio(anio, mes) {
  const { inicio, fin } = rangoMes(anio, mes);

  const proyectos = await prisma.proyecto.findMany({
    where: {
      fechaFacturacion: { gte: new Date(`${anio}-01-01`), lt: fin },
      estado: { in: ['FACTURADO', 'FALTA_COBRAR'] },
    },
  });

  const totalAnio = proyectos.reduce((acc, p) => {
    const base = p.subtotalUYU ?? (p.subtotalUSD && p.cotizacionDolar ? p.subtotalUSD * p.cotizacionDolar : 0);
    return acc + (base || 0);
  }, 0);

  // Solo en el mes de diciembre (cierre de ejercicio) o como estimación mensual
  return parseFloat((totalAnio * TASAS.PATRIMONIO / 12).toFixed(2));
}

/**
 * Obtiene o crea el registro de impuestos para un mes,
 * recalculando los valores automáticos.
 */
async function getOCalcularImpuestosMes(anio, mes) {
  const [iva, irae, patrimonio, bps] = await Promise.all([
    calcularIVA(anio, mes),
    calcularIRAE(anio, mes),
    calcularPatrimonio(anio, mes),
    calcularBPS(anio, mes),
  ]);

  return prisma.impuestosMes.upsert({
    where: { anio_mes: { anio, mes } },
    create: {
      anio, mes,
      ivaCalculado: iva,
      iraeCalculado: irae,
      patrimonioCalculado: patrimonio,
      bpsCalculado: bps,
    },
    update: {
      ivaCalculado: iva,
      iraeCalculado: irae,
      patrimonioCalculado: patrimonio,
      bpsCalculado: bps,
    },
    include: { notas: { orderBy: { createdAt: 'asc' } } },
  });
}

function rangoMes(anio, mes) {
  const inicio = new Date(anio, mes - 1, 1);
  const fin    = new Date(anio, mes, 1);
  return { inicio, fin };
}

module.exports = { getOCalcularImpuestosMes, calcularIVA, calcularIRAE, calcularBPS, calcularPatrimonio };
