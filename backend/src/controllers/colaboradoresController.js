const prisma = require('../lib/prisma');
const { NotFoundError } = require('../middlewares/errorHandler');

async function listar(req, res) {
  const colaboradores = await prisma.colaborador.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      historialSueldos: {
        where: { fechaHasta: null },
        take: 1,
      },
    },
  });
  res.json(colaboradores);
}

async function obtener(req, res) {
  const id = parseInt(req.params.id);
  const colaborador = await prisma.colaborador.findUnique({
    where: { id },
    include: {
      historialSueldos: { orderBy: { fechaDesde: 'desc' } },
    },
  });
  if (!colaborador) throw new NotFoundError('Colaborador');
  res.json(colaborador);
}

async function crear(req, res) {
  const { sueldoActual, fechaAlta, ...data } = req.body;

  const colaborador = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.colaborador.create({
      data: { ...data, sueldoActual, fechaAlta: new Date(fechaAlta) },
    });

    // Registrar sueldo inicial en el historial
    await tx.historialSueldo.create({
      data: {
        colaboradorId: nuevo.id,
        sueldo: sueldoActual,
        moneda: 'UYU',
        fechaDesde: new Date(fechaAlta),
        motivo: 'Sueldo inicial',
      },
    });

    return nuevo;
  });

  res.status(201).json(colaborador);
}

async function actualizar(req, res) {
  const id = parseInt(req.params.id);

  const colaborador = await prisma.$transaction(async (tx) => {
    const updated = await tx.colaborador.update({
      where: { id },
      data: req.body,
    });

    // Si cambió fechaAlta, sincronizar el primer registro de historial
    if (req.body.fechaAlta) {
      const inicial = await tx.historialSueldo.findFirst({
        where: { colaboradorId: id },
        orderBy: { fechaDesde: 'asc' },
      });
      if (inicial) {
        await tx.historialSueldo.update({
          where: { id: inicial.id },
          data: { fechaDesde: new Date(req.body.fechaAlta) },
        });
      }
    }

    return updated;
  });

  res.json(colaborador);
}

async function eliminar(req, res) {
  const id = parseInt(req.params.id);
  await prisma.colaborador.delete({ where: { id } });
  res.status(204).send();
}

// GET /api/colaboradores/:id/sueldos
async function historialSueldos(req, res) {
  const colaboradorId = parseInt(req.params.id);
  const historial = await prisma.historialSueldo.findMany({
    where: { colaboradorId },
    orderBy: { fechaDesde: 'desc' },
  });
  res.json(historial);
}

// POST /api/colaboradores/:id/sueldos
// Cierra el periodo anterior y abre uno nuevo
async function registrarSueldo(req, res) {
  const colaboradorId = parseInt(req.params.id);
  const { sueldo, moneda = 'UYU', fechaDesde, motivo } = req.body;
  const fechaDesdeDate = new Date(fechaDesde);

  const resultado = await prisma.$transaction(async (tx) => {
    // Cerrar el período vigente (fechaHasta = null → el día anterior al nuevo)
    const vigente = await tx.historialSueldo.findFirst({
      where: { colaboradorId, fechaHasta: null },
      orderBy: { fechaDesde: 'desc' },
    });

    if (vigente) {
      const fechaHasta = new Date(fechaDesdeDate);
      fechaHasta.setDate(fechaHasta.getDate() - 1);
      await tx.historialSueldo.update({
        where: { id: vigente.id },
        data: { fechaHasta },
      });
    }

    // Crear nuevo período
    const nuevo = await tx.historialSueldo.create({
      data: { colaboradorId, sueldo, moneda, fechaDesde: fechaDesdeDate, motivo },
    });

    // Actualizar cache en el colaborador
    await tx.colaborador.update({
      where: { id: colaboradorId },
      data: { sueldoActual: sueldo },
    });

    return nuevo;
  });

  res.status(201).json(resultado);
}

module.exports = { listar, obtener, crear, actualizar, eliminar, historialSueldos, registrarSueldo };
