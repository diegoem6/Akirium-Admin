const router = require('express').Router();
const prisma = require('../lib/prisma');

/**
 * GET /api/flujo-caja?anio=2024&moneda=UYU
 *
 * Devuelve por cada mes:
 *   - ingresos (proyectos cobrados / facturados ese mes)
 *   - egresos (pagos y devoluciones del mes)
 *   - impuestos pagados (real o calculado)
 *   - saldo neto
 *   - saldo acumulado
 */
router.get('/', async (req, res) => {
  const anio   = parseInt(req.query.anio  || new Date().getFullYear());
  const moneda = (req.query.moneda || 'UYU').toUpperCase();

  const inicio = new Date(anio, 0, 1);
  const fin    = new Date(anio + 1, 0, 1);

  // ── Ingresos: proyectos cobrados en el año (por fechaCobroEfectivo o fechaFacturacion como fallback)
  const proyectos = await prisma.proyecto.findMany({
    where: {
      estado: 'COBRADO',
      OR: [
        { fechaCobroEfectivo: { gte: inicio, lt: fin } },
        { fechaCobroEfectivo: null, fechaFacturacion: { gte: inicio, lt: fin } },
      ],
    },
  });

  // ── Egresos del año
  const egresos = await prisma.egreso.findMany({
    where: { fecha: { gte: inicio, lt: fin }, estado: 'PAGADO' },
  });

  // ── Impuestos del año
  const impuestos = await prisma.impuestosMes.findMany({
    where: { anio },
  });

  // Inicializar array de 12 meses
  const meses = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    ingresos:   0,
    egresos:    0,
    impuestos:  0,
    saldo:      0,
    acumulado:  0,
  }));

  // ── Acumular ingresos por mes
  for (const p of proyectos) {
    const fechaIngreso = p.fechaCobroEfectivo ?? p.fechaFacturacion;
    const mes = new Date(fechaIngreso).getMonth(); // 0-indexed
    let monto = 0;

    if (moneda === 'UYU') {
      monto = p.subtotalUYU ?? (p.subtotalUSD && p.cotizacionDolar ? p.subtotalUSD * p.cotizacionDolar : 0);
    } else {
      monto = p.subtotalUSD ?? (p.subtotalUYU && p.cotizacionDolar ? p.subtotalUYU / p.cotizacionDolar : 0);
    }

    // Sumar IVA al ingreso si corresponde
    const tasaIVA = p.tipoIVA === 'BASICO' ? 0.22 : 0;
    meses[mes].ingresos += monto * (1 + tasaIVA);
  }

  // ── Acumular egresos y devoluciones por mes
  // DEVOLUCION es la operación inversa: suma como ingreso
  for (const e of egresos) {
    const mes = new Date(e.fecha).getMonth();
    let monto = e.moneda === moneda ? e.monto : 0;

    if (e.tipo === 'DEVOLUCION') {
      meses[mes].ingresos += monto;
    } else {
      meses[mes].egresos += monto;
    }
  }

  // ── Acumular impuestos por mes (siempre en UYU, simplificado)
  for (const imp of impuestos) {
    const idx = imp.mes - 1;
    if (moneda === 'UYU') {
      const total = (imp.ivaReal ?? imp.ivaCalculado)
        + (imp.iraeReal ?? imp.iraeCalculado)
        + (imp.patrimonioReal ?? imp.patrimonioCalculado)
        + (imp.bpsReal ?? imp.bpsCalculado);
      meses[idx].impuestos += total;
    }
  }

  // ── Calcular saldo y acumulado
  let acumulado = 0;
  for (const m of meses) {
    m.ingresos  = parseFloat(m.ingresos.toFixed(2));
    m.egresos   = parseFloat(m.egresos.toFixed(2));
    m.impuestos = parseFloat(m.impuestos.toFixed(2));
    m.saldo     = parseFloat((m.ingresos - m.egresos - m.impuestos).toFixed(2));
    acumulado  += m.saldo;
    m.acumulado = parseFloat(acumulado.toFixed(2));
  }

  res.json({ anio, moneda, meses });
});

module.exports = router;
