const router = require('express').Router();
const Joi = require('joi');
const { validate } = require('../middlewares/validate');
const prisma = require('../lib/prisma');
const { getOCalcularImpuestosMes } = require('../services/impuestosService');
const { NotFoundError } = require('../middlewares/errorHandler');

const updateSchema = Joi.object({
  ivaReal:        Joi.number().min(0).allow(null).optional(),
  iraeReal:       Joi.number().min(0).allow(null).optional(),
  patrimonioReal: Joi.number().min(0).allow(null).optional(),
  bpsReal:        Joi.number().min(0).allow(null).optional(),
});

const notaSchema = Joi.object({
  texto: Joi.string().required(),
});

// GET /api/impuestos/:anio/:mes  → calcula y devuelve
router.get('/:anio/:mes', async (req, res) => {
  const anio = parseInt(req.params.anio);
  const mes  = parseInt(req.params.mes);
  const registro = await getOCalcularImpuestosMes(anio, mes);
  res.json(registro);
});

// GET /api/impuestos/:anio  → todos los meses del año (sin recalcular)
router.get('/:anio', async (req, res) => {
  const anio = parseInt(req.params.anio);
  const registros = await prisma.impuestosMes.findMany({
    where: { anio },
    include: { notas: true },
    orderBy: { mes: 'asc' },
  });
  res.json(registros);
});

// PUT /api/impuestos/:anio/:mes  → editar valores reales manualmente
router.put('/:anio/:mes', validate(updateSchema), async (req, res) => {
  const anio = parseInt(req.params.anio);
  const mes  = parseInt(req.params.mes);

  const registro = await prisma.impuestosMes.upsert({
    where: { anio_mes: { anio, mes } },
    create: { anio, mes, ...req.body },
    update: req.body,
    include: { notas: true },
  });
  res.json(registro);
});

// POST /api/impuestos/:anio/:mes/notas  → agregar nota de discrepancia
router.post('/:anio/:mes/notas', validate(notaSchema), async (req, res) => {
  const anio = parseInt(req.params.anio);
  const mes  = parseInt(req.params.mes);

  // Asegurar que exista el registro del mes
  let registro = await prisma.impuestosMes.findUnique({
    where: { anio_mes: { anio, mes } },
  });
  if (!registro) {
    registro = await getOCalcularImpuestosMes(anio, mes);
  }

  const nota = await prisma.notaImpuesto.create({
    data: { impuestosMesId: registro.id, texto: req.body.texto },
  });
  res.status(201).json(nota);
});

// DELETE /api/impuestos/notas/:notaId
router.delete('/notas/:notaId', async (req, res) => {
  const id = parseInt(req.params.notaId);
  await prisma.notaImpuesto.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/impuestos/:anio/:mes/recalcular  → fuerza recálculo
router.post('/:anio/:mes/recalcular', async (req, res) => {
  const anio = parseInt(req.params.anio);
  const mes  = parseInt(req.params.mes);
  const registro = await getOCalcularImpuestosMes(anio, mes);
  res.json(registro);
});

module.exports = router;
