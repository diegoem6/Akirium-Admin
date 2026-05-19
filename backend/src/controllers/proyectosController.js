const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { NotFoundError, AppError } = require('../middlewares/errorHandler');
const { calcularMontos, calcularFechaPosibleCobro } = require('../services/montosService');

function enriquecerProyecto(p) {
  const montos = calcularMontos(p);
  return { ...p, ...montos };
}

// GET /api/proyectos
async function listar(req, res) {
  const { estado, clienteId } = req.query;
  const where = {};
  if (estado)    where.estado    = estado;
  if (clienteId) where.clienteId = parseInt(clienteId);

  const proyectos = await prisma.proyecto.findMany({
    where,
    include: {
      cliente:   { select: { id: true, nombre: true } },
      referente: { select: { id: true, nombre: true } },
      archivos:  true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(proyectos.map(enriquecerProyecto));
}

// GET /api/proyectos/:id
async function obtener(req, res) {
  const id = parseInt(req.params.id);
  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      cliente:   true,
      referente: true,
      archivos:  true,
    },
  });
  if (!proyecto) throw new NotFoundError('Proyecto');
  res.json(enriquecerProyecto(proyecto));
}

// POST /api/proyectos
async function crear(req, res) {
  const data = { ...req.body };

  // Calcular fecha de posible cobro si viene fecha de facturación
  if (data.fechaFacturacion) {
    data.fechaPosibleCobro = calcularFechaPosibleCobro(data.fechaFacturacion);
  }

  const proyecto = await prisma.proyecto.create({
    data,
    include: { cliente: true, referente: true, archivos: true },
  });
  res.status(201).json(enriquecerProyecto(proyecto));
}

// PUT /api/proyectos/:id
async function actualizar(req, res) {
  const id = parseInt(req.params.id);
  const data = { ...req.body };

  if (data.fechaFacturacion !== undefined) {
    data.fechaPosibleCobro = calcularFechaPosibleCobro(data.fechaFacturacion);
  }

  const proyecto = await prisma.proyecto.update({
    where: { id },
    data,
    include: { cliente: true, referente: true, archivos: true },
  });
  res.json(enriquecerProyecto(proyecto));
}

// DELETE /api/proyectos/:id
async function eliminar(req, res) {
  const id = parseInt(req.params.id);
  // Cascade borra archivos en BD; también borramos físicamente
  const archivos = await prisma.archivo.findMany({ where: { proyectoId: id } });
  await prisma.proyecto.delete({ where: { id } });
  archivos.forEach(a => {
    try { fs.unlinkSync(path.resolve(a.path)); } catch (_) {}
  });
  res.status(204).send();
}

// POST /api/proyectos/:proyectoId/archivos
async function subirArchivo(req, res) {
  const proyectoId = parseInt(req.params.proyectoId);
  const { tipo } = req.body; // COTIZACION | ORDEN_COMPRA | FACTURA

  if (!req.file) throw new AppError('No se recibió ningún archivo', 400);
  if (!tipo)     throw new AppError('El campo tipo es requerido', 400);

  const tiposValidos = ['COTIZACION', 'ORDEN_COMPRA', 'FACTURA'];
  if (!tiposValidos.includes(tipo)) throw new AppError('Tipo de archivo inválido', 400);

  const archivo = await prisma.archivo.create({
    data: {
      tipo,
      nombre:    req.file.originalname,
      path:      req.file.path,
      mimetype:  req.file.mimetype,
      tamanio:   req.file.size,
      proyectoId,
    },
  });
  res.status(201).json(archivo);
}

// DELETE /api/proyectos/:proyectoId/archivos/:archivoId
async function eliminarArchivo(req, res) {
  const id = parseInt(req.params.archivoId);
  const archivo = await prisma.archivo.findUnique({ where: { id } });
  if (!archivo) throw new NotFoundError('Archivo');

  await prisma.archivo.delete({ where: { id } });
  try { fs.unlinkSync(path.resolve(archivo.path)); } catch (_) {}

  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar, subirArchivo, eliminarArchivo };
