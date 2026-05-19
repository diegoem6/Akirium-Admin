const router = require('express').Router();
const Joi = require('joi');
const prisma = require('../lib/prisma');
const { validate } = require('../middlewares/validate');

// ─── Tasas BPS Uruguay ──────────────────────────────────────────
const BPS_EMPLEADO = { jubilacion: 0.15, fonasa: 0.03, frl: 0.001 };
const BPS_PATRONAL = { jubilacion: 0.075, fonasa: 0.05, fega: 0.00025, frl: 0.001 };

// ─── Franjas IRPF mensual (BPC 2025 ≈ $6,556 UYU) ─────────────
const FRANJAS_IRPF = [
  { hasta: 45892,    tasa: 0    },
  { hasta: 65560,    tasa: 0.10 },
  { hasta: 131120,   tasa: 0.15 },
  { hasta: 196680,   tasa: 0.20 },
  { hasta: 327800,   tasa: 0.22 },
  { hasta: Infinity, tasa: 0.25 },
];

const MESES_NOMBRES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function round(n) { return parseFloat(n.toFixed(2)); }

function calcularIRPF(base) {
  let irpf = 0, anterior = 0;
  for (const franja of FRANJAS_IRPF) {
    if (base <= anterior) break;
    const tramo = Math.min(base, franja.hasta) - anterior;
    irpf += tramo * franja.tasa;
    anterior = franja.hasta;
  }
  return irpf;
}

function calcularLiquidacion(sueldo) {
  const bruto = sueldo;
  const jubilacion  = round(bruto * BPS_EMPLEADO.jubilacion);
  const fonasa      = round(bruto * BPS_EMPLEADO.fonasa);
  const frl         = round(bruto * BPS_EMPLEADO.frl);
  const totalBps    = jubilacion + fonasa + frl;
  const baseIRPF    = bruto - totalBps;
  const irpf        = round(calcularIRPF(baseIRPF));
  const totalDescuentos = totalBps + irpf;
  const neto            = round(bruto - totalDescuentos);
  const patronalJubilacion = round(bruto * BPS_PATRONAL.jubilacion);
  const patronalFonasa     = round(bruto * BPS_PATRONAL.fonasa);
  const patronalFega       = round(bruto * BPS_PATRONAL.fega);
  const patronalFrl        = round(bruto * BPS_PATRONAL.frl);
  const totalPatronal      = patronalJubilacion + patronalFonasa + patronalFega + patronalFrl;
  return {
    bruto,
    empleado: { jubilacion, fonasa, frl, totalBps, irpf, totalDescuentos },
    neto,
    patronal: { jubilacion: patronalJubilacion, fonasa: patronalFonasa, fega: patronalFega, frl: patronalFrl, totalPatronal },
    costoTotal: round(bruto + totalPatronal),
  };
}

// Combina valores calculados con overrides del registro persistido
function aplicarOverrides(calc, reg) {
  const bruto         = reg?.brutoReal    ?? calc.bruto;
  const bps           = reg?.bpsReal      ?? calc.empleado.totalBps;
  const irpf          = reg?.irpfReal     ?? calc.empleado.irpf;
  const totalDescuentos = round(bps + irpf);
  const neto          = reg?.netoReal     ?? calc.neto;
  const totalPatronal = reg?.patronalReal ?? calc.patronal.totalPatronal;
  const costoTotal    = round(bruto + totalPatronal);
  return {
    bruto,
    empleado: { ...calc.empleado, totalBps: bps, irpf, totalDescuentos },
    neto,
    patronal: { ...calc.patronal, totalPatronal },
    costoTotal,
  };
}

const updateSchema = Joi.object({
  brutoReal:    Joi.number().min(0).allow(null).optional(),
  bpsReal:      Joi.number().min(0).allow(null).optional(),
  irpfReal:     Joi.number().min(0).allow(null).optional(),
  netoReal:     Joi.number().min(0).allow(null).optional(),
  patronalReal: Joi.number().min(0).allow(null).optional(),
});

// GET /api/liquidaciones/:anio/:mes
router.get('/:anio/:mes', async (req, res) => {
  const anio = parseInt(req.params.anio);
  const mes  = parseInt(req.params.mes);

  const inicioMes = new Date(Date.UTC(anio, mes - 1, 1));
  const finMes    = new Date(Date.UTC(anio, mes, 1) - 1);

  const historial = await prisma.historialSueldo.findMany({
    where: {
      fechaDesde: { lte: finMes },
      OR: [{ fechaHasta: null }, { fechaHasta: { gte: inicioMes } }],
      colaborador: { tipo: 'EMPLEADO', fechaAlta: { lte: finMes } },
    },
    include: {
      colaborador: { select: { id: true, nombre: true, mail: true } },
    },
  });

  // Un registro por empleado (el más reciente del mes)
  const porColaborador = new Map();
  for (const h of historial) {
    const prev = porColaborador.get(h.colaboradorId);
    if (!prev || h.fechaDesde > prev.fechaDesde) porColaborador.set(h.colaboradorId, h);
  }

  const colaboradorIds = [...porColaborador.keys()];

  // Cargar registros persistidos
  const registros = await prisma.liquidacionEmpleado.findMany({
    where: { anio, mes, colaboradorId: { in: colaboradorIds } },
  });
  const regMap = new Map(registros.map(r => [r.colaboradorId, r]));

  const liquidaciones = [];

  for (const h of porColaborador.values()) {
    const calc = calcularLiquidacion(h.sueldo);

    // Upsert: siempre actualiza los valores calculados
    const reg = await prisma.liquidacionEmpleado.upsert({
      where: { colaboradorId_anio_mes: { colaboradorId: h.colaboradorId, anio, mes } },
      create: {
        colaboradorId:       h.colaboradorId,
        anio,
        mes,
        brutoCalculado:      calc.bruto,
        bpsCalculado:        calc.empleado.totalBps,
        irpfCalculado:       calc.empleado.irpf,
        netoCalculado:       calc.neto,
        patronalCalculado:   calc.patronal.totalPatronal,
        costoTotalCalculado: calc.costoTotal,
      },
      update: {
        brutoCalculado:      calc.bruto,
        bpsCalculado:        calc.empleado.totalBps,
        irpfCalculado:       calc.empleado.irpf,
        netoCalculado:       calc.neto,
        patronalCalculado:   calc.patronal.totalPatronal,
        costoTotalCalculado: calc.costoTotal,
      },
    });

    const efectivo = aplicarOverrides(calc, reg);

    liquidaciones.push({
      liquidacionId:  reg.id,
      colaboradorId:  h.colaboradorId,
      nombre:         h.colaborador.nombre,
      mail:           h.colaborador.mail,
      moneda:         h.moneda,
      // Valores efectivos (override ?? calculado)
      ...efectivo,
      // Calculados originales (para la tabla comparativa)
      calculado: {
        bruto:    calc.bruto,
        bps:      calc.empleado.totalBps,
        irpf:     calc.empleado.irpf,
        neto:     calc.neto,
        patronal: calc.patronal.totalPatronal,
      },
      // Overrides persistidos
      brutoReal:    reg.brutoReal,
      bpsReal:      reg.bpsReal,
      irpfReal:     reg.irpfReal,
      netoReal:     reg.netoReal,
      patronalReal: reg.patronalReal,
      // Pago
      pagado:       reg.pagado,
      egresoId:     reg.egresoId,
    });
  }

  liquidaciones.sort((a, b) => a.nombre.localeCompare(b.nombre));

  const totales = liquidaciones.reduce((acc, l) => ({
    bruto:           round(acc.bruto           + l.bruto),
    totalBps:        round(acc.totalBps        + l.empleado.totalBps),
    irpf:            round(acc.irpf            + l.empleado.irpf),
    totalDescuentos: round(acc.totalDescuentos + l.empleado.totalDescuentos),
    neto:            round(acc.neto            + l.neto),
    totalPatronal:   round(acc.totalPatronal   + l.patronal.totalPatronal),
    costoTotal:      round(acc.costoTotal      + l.costoTotal),
  }), { bruto: 0, totalBps: 0, irpf: 0, totalDescuentos: 0, neto: 0, totalPatronal: 0, costoTotal: 0 });

  res.json({ anio, mes, liquidaciones, totales });
});

// PUT /api/liquidaciones/:anio/:mes/:colaboradorId  → editar valores reales
router.put('/:anio/:mes/:colaboradorId', validate(updateSchema), async (req, res) => {
  const anio          = parseInt(req.params.anio);
  const mes           = parseInt(req.params.mes);
  const colaboradorId = parseInt(req.params.colaboradorId);

  const reg = await prisma.liquidacionEmpleado.update({
    where: { colaboradorId_anio_mes: { colaboradorId, anio, mes } },
    data: req.body,
  });
  res.json(reg);
});

// POST /api/liquidaciones/:anio/:mes/:colaboradorId/pagar  → registrar pago
router.post('/:anio/:mes/:colaboradorId/pagar', async (req, res) => {
  const anio          = parseInt(req.params.anio);
  const mes           = parseInt(req.params.mes);
  const colaboradorId = parseInt(req.params.colaboradorId);

  const reg = await prisma.liquidacionEmpleado.findUnique({
    where: { colaboradorId_anio_mes: { colaboradorId, anio, mes } },
    include: { colaborador: { select: { nombre: true } } },
  });
  if (!reg) return res.status(404).json({ error: 'Liquidación no encontrada' });
  if (reg.pagado) return res.status(409).json({ error: 'Ya está pagado' });

  const neto        = reg.netoReal ?? reg.netoCalculado;
  const descripcion = `Sueldo ${MESES_NOMBRES[mes - 1]} ${anio} — ${reg.colaborador.nombre}`;
  const fecha       = new Date(Date.UTC(anio, mes, 0)); // último día del mes

  const result = await prisma.$transaction(async (tx) => {
    const egreso = await tx.egreso.create({
      data: {
        fecha,
        descripcion,
        tipo:          'EGRESO',
        monto:         neto,
        moneda:        'UYU',
        estado:        'PAGADO',
        colaboradorId,
      },
    });

    const liquidacion = await tx.liquidacionEmpleado.update({
      where: { colaboradorId_anio_mes: { colaboradorId, anio, mes } },
      data:  { pagado: true, egresoId: egreso.id },
    });

    return { egreso, liquidacion };
  });

  res.status(201).json(result);
});

// DELETE /api/liquidaciones/:anio/:mes/:colaboradorId/pago  → revertir pago
router.delete('/:anio/:mes/:colaboradorId/pago', async (req, res) => {
  const anio          = parseInt(req.params.anio);
  const mes           = parseInt(req.params.mes);
  const colaboradorId = parseInt(req.params.colaboradorId);

  const reg = await prisma.liquidacionEmpleado.findUnique({
    where: { colaboradorId_anio_mes: { colaboradorId, anio, mes } },
  });
  if (!reg || !reg.pagado) return res.status(404).json({ error: 'No hay pago registrado' });

  await prisma.$transaction(async (tx) => {
    if (reg.egresoId) await tx.egreso.delete({ where: { id: reg.egresoId } });
    await tx.liquidacionEmpleado.update({
      where: { colaboradorId_anio_mes: { colaboradorId, anio, mes } },
      data:  { pagado: false, egresoId: null },
    });
  });

  res.status(204).send();
});

module.exports = router;
