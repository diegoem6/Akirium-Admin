const router = require('express').Router();
const prisma = require('../lib/prisma');

// GET /api/utilidades?anio=2026
router.get('/', async (req, res) => {
  const anio  = parseInt(req.query.anio || new Date().getFullYear());
  const inicio = new Date(anio, 0, 1);
  const fin    = new Date(anio + 1, 0, 1);

  const [proyectos, egresos, impuestos, socios] = await Promise.all([
    prisma.proyecto.findMany({
      where: {
        estado: 'COBRADO',
        OR: [
          { fechaCobroEfectivo: { gte: inicio, lt: fin } },
          { fechaCobroEfectivo: null, fechaFacturacion: { gte: inicio, lt: fin } },
        ],
      },
    }),
    prisma.egreso.findMany({
      where: { fecha: { gte: inicio, lt: fin }, estado: 'PAGADO' },
    }),
    prisma.impuestosMes.findMany({ where: { anio } }),
    prisma.colaborador.findMany({
      where: { tipo: 'SOCIO' },
      orderBy: { nombre: 'asc' },
    }),
  ]);

  function calcularResumen(moneda) {
    let ingresos = 0, totalEgresos = 0, totalImpuestos = 0;

    for (const p of proyectos) {
      let monto = moneda === 'UYU'
        ? (p.subtotalUYU ?? (p.subtotalUSD && p.cotizacionDolar ? p.subtotalUSD * p.cotizacionDolar : 0))
        : (p.subtotalUSD ?? (p.subtotalUYU && p.cotizacionDolar ? p.subtotalUYU / p.cotizacionDolar : 0));
      ingresos += monto * (p.tipoIVA === 'BASICO' ? 1.22 : 1);
    }

    for (const e of egresos) {
      if (e.moneda !== moneda) continue;
      if (e.tipo === 'DEVOLUCION') ingresos     += e.monto;
      else                          totalEgresos += e.monto;
    }

    if (moneda === 'UYU') {
      for (const imp of impuestos) {
        totalImpuestos +=
          (imp.ivaReal      ?? imp.ivaCalculado)      +
          (imp.iraeReal     ?? imp.iraeCalculado)     +
          (imp.patrimonioReal ?? imp.patrimonioCalculado) +
          (imp.bpsReal      ?? imp.bpsCalculado);
      }
    }

    const acumulado = ingresos - totalEgresos - totalImpuestos;
    return {
      ingresos:  parseFloat(ingresos.toFixed(2)),
      egresos:   parseFloat(totalEgresos.toFixed(2)),
      impuestos: parseFloat(totalImpuestos.toFixed(2)),
      acumulado: parseFloat(acumulado.toFixed(2)),
    };
  }

  const resumenUYU = calcularResumen('UYU');
  const resumenUSD = calcularResumen('USD');

  const totalAcciones = socios.reduce((sum, s) => sum + (s.porcentajeAcciones ?? 0), 0);

  const distribucion = socios.map(s => {
    const pct = (s.porcentajeAcciones ?? 0) / 100;
    return {
      id:                 s.id,
      nombre:             s.nombre,
      porcentajeAcciones: s.porcentajeAcciones ?? 0,
      utilidadUYU:        parseFloat((resumenUYU.acumulado * pct).toFixed(2)),
      utilidadUSD:        parseFloat((resumenUSD.acumulado * pct).toFixed(2)),
    };
  });

  res.json({ anio, resumen: { UYU: resumenUYU, USD: resumenUSD }, totalAcciones, distribucion });
});

module.exports = router;
