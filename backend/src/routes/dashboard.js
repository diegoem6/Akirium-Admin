const router = require('express').Router();
const prisma = require('../lib/prisma');

/**
 * GET /api/dashboard
 * Devuelve KPIs y datos para los gráficos del dashboard.
 */
router.get('/', async (req, res) => {
  const hoy = new Date();

  // ── 1. Conteo de proyectos por estado ───────────────────────
  const estadosRaw = await prisma.proyecto.groupBy({
    by: ['estado'],
    _count: { id: true },
  });

  const estadoMap = {};
  for (const e of estadosRaw) estadoMap[e.estado] = e._count.id;

  const proyectosPorEstado = {
    FALTA_COTIZAR: estadoMap.FALTA_COTIZAR || 0,
    FALTA_OC:      estadoMap.FALTA_OC      || 0,
    EN_EJECUCION:  estadoMap.EN_EJECUCION  || 0,
    FACTURADO:     estadoMap.FACTURADO     || 0,
    FALTA_COBRAR:  estadoMap.FALTA_COBRAR  || 0,
  };

  // ── 2. Facturación últimos 6 meses ──────────────────────────
  const seisMesesAtras = new Date(hoy);
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
  seisMesesAtras.setDate(1);
  seisMesesAtras.setHours(0, 0, 0, 0);

  const proyectosFacturados = await prisma.proyecto.findMany({
    where: {
      fechaFacturacion: { gte: seisMesesAtras },
      estado: { in: ['FACTURADO', 'FALTA_COBRAR'] },
    },
  });

  // Agrupar por mes
  const facturacionPorMes = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    facturacionPorMes[key] = { mes: key, totalUSD: 0, totalUYU: 0, cantidad: 0 };
  }

  for (const p of proyectosFacturados) {
    if (!p.fechaFacturacion) continue;
    const d = new Date(p.fechaFacturacion);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!facturacionPorMes[key]) continue;

    const tasaIVA = p.tipoIVA === 'BASICO' ? 0.22 : 0;

    if (p.subtotalUSD != null) {
      facturacionPorMes[key].totalUSD += p.subtotalUSD * (1 + tasaIVA);
    }
    if (p.subtotalUYU != null) {
      facturacionPorMes[key].totalUYU += p.subtotalUYU * (1 + tasaIVA);
    } else if (p.subtotalUSD != null && p.cotizacionDolar) {
      facturacionPorMes[key].totalUYU += p.subtotalUSD * p.cotizacionDolar * (1 + tasaIVA);
    }

    facturacionPorMes[key].cantidad += 1;
  }

  // Redondear
  const facturacion6Meses = Object.values(facturacionPorMes).map(m => ({
    ...m,
    totalUSD: parseFloat(m.totalUSD.toFixed(2)),
    totalUYU: parseFloat(m.totalUYU.toFixed(2)),
  }));

  // ── 3. KPIs generales ────────────────────────────────────────
  const totalProyectos = await prisma.proyecto.count();
  const totalClientes  = await prisma.cliente.count();
  const totalColaboradores = await prisma.colaborador.count();

  // Monto pendiente de cobro (proyectos en FALTA_COBRAR)
  const pendientesCobro = await prisma.proyecto.findMany({
    where: { estado: 'FALTA_COBRAR' },
  });

  const montoPendienteUSD = pendientesCobro.reduce((acc, p) => {
    const tasaIVA = p.tipoIVA === 'BASICO' ? 0.22 : 0;
    return acc + ((p.subtotalUSD ?? 0) * (1 + tasaIVA));
  }, 0);

  const montoPendienteUYU = pendientesCobro.reduce((acc, p) => {
    const tasaIVA = p.tipoIVA === 'BASICO' ? 0.22 : 0;
    const base = p.subtotalUYU ?? (p.subtotalUSD && p.cotizacionDolar ? p.subtotalUSD * p.cotizacionDolar : 0);
    return acc + (base * (1 + tasaIVA));
  }, 0);

  // ── 4. Próximos cobros (30 días) ─────────────────────────────
  const en30Dias = new Date(hoy);
  en30Dias.setDate(en30Dias.getDate() + 30);

  const proximosCobros = await prisma.proyecto.findMany({
    where: {
      estado: 'FALTA_COBRAR',
      fechaPosibleCobro: { gte: hoy, lte: en30Dias },
    },
    include: { cliente: { select: { nombre: true } } },
    orderBy: { fechaPosibleCobro: 'asc' },
    take: 5,
  });

  res.json({
    proyectosPorEstado,
    facturacion6Meses,
    kpis: {
      totalProyectos,
      totalClientes,
      totalColaboradores,
      montoPendienteUSD: parseFloat(montoPendienteUSD.toFixed(2)),
      montoPendienteUYU: parseFloat(montoPendienteUYU.toFixed(2)),
      proyectosEnEjecucion: proyectosPorEstado.EN_EJECUCION,
    },
    proximosCobros,
  });
});

module.exports = router;
