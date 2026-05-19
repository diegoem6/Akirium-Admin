const router = require('express').Router();
const { validate } = require('../middlewares/validate');
const { upload } = require('../middlewares/upload');
const Joi = require('joi');
const prisma = require('../lib/prisma');
const { NotFoundError, AppError } = require('../middlewares/errorHandler');
const path = require('path');
const fs = require('fs');

// ─── Schema ────────────────────────────────────────────────────
const egresoSchema = Joi.object({
  fecha:         Joi.date().iso().required(),
  descripcion:   Joi.string().max(300).required(),
  tipo:          Joi.string().valid('EGRESO', 'DEVOLUCION').required(),
  monto:         Joi.number().positive().required(),
  moneda:        Joi.string().valid('USD', 'UYU').required(),
  estado:        Joi.string().valid('PAGADO', 'PENDIENTE').default('PENDIENTE'),
  colaboradorId: Joi.number().integer().positive().allow(null).optional(),
});

const egresoUpdateSchema = egresoSchema.fork(
  ['fecha', 'descripcion', 'tipo', 'monto', 'moneda'],
  (s) => s.optional()
);

// ─── Controller ────────────────────────────────────────────────
async function listar(req, res) {
  const { tipo, estado, colaboradorId, desde, hasta } = req.query;
  const where = {};
  if (tipo)          where.tipo          = tipo;
  if (estado)        where.estado        = estado;
  if (colaboradorId) where.colaboradorId = parseInt(colaboradorId);
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const egresos = await prisma.egreso.findMany({
    where,
    include: {
      colaborador: { select: { id: true, nombre: true } },
      archivos: true,
    },
    orderBy: { fecha: 'desc' },
  });
  res.json(egresos);
}

async function obtener(req, res) {
  const id = parseInt(req.params.id);
  const egreso = await prisma.egreso.findUnique({
    where: { id },
    include: { colaborador: true, archivos: true },
  });
  if (!egreso) throw new NotFoundError('Egreso');
  res.json(egreso);
}

async function crear(req, res) {
  const egreso = await prisma.egreso.create({
    data: req.body,
    include: { colaborador: true, archivos: true },
  });
  res.status(201).json(egreso);
}

async function actualizar(req, res) {
  const id = parseInt(req.params.id);
  const egreso = await prisma.egreso.update({
    where: { id },
    data: req.body,
    include: { colaborador: true, archivos: true },
  });
  res.json(egreso);
}

async function eliminar(req, res) {
  const id = parseInt(req.params.id);
  const archivos = await prisma.archivo.findMany({ where: { egresoId: id } });
  await prisma.egreso.delete({ where: { id } });
  archivos.forEach(a => { try { fs.unlinkSync(path.resolve(a.path)); } catch (_) {} });
  res.status(204).send();
}

async function subirComprobante(req, res) {
  const egresoId = parseInt(req.params.egresoId);
  if (!req.file) throw new AppError('No se recibió ningún archivo', 400);

  const archivo = await prisma.archivo.create({
    data: {
      tipo:     'COMPROBANTE_EGRESO',
      nombre:   req.file.originalname,
      path:     req.file.path,
      mimetype: req.file.mimetype,
      tamanio:  req.file.size,
      egresoId,
    },
  });
  res.status(201).json(archivo);
}

async function eliminarComprobante(req, res) {
  const id = parseInt(req.params.archivoId);
  const archivo = await prisma.archivo.findUnique({ where: { id } });
  if (!archivo) throw new NotFoundError('Archivo');
  await prisma.archivo.delete({ where: { id } });
  try { fs.unlinkSync(path.resolve(archivo.path)); } catch (_) {}
  res.status(204).send();
}

// ─── Rutas ─────────────────────────────────────────────────────
router.get('/',                                     listar);
router.get('/:id',                                  obtener);
router.post('/',                                    validate(egresoSchema), crear);
router.put('/:id',                                  validate(egresoUpdateSchema), actualizar);
router.delete('/:id',                               eliminar);
router.post('/:egresoId/comprobante',               upload.single('archivo'), subirComprobante);
router.delete('/:egresoId/comprobante/:archivoId',  eliminarComprobante);

module.exports = router;
