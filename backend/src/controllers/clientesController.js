const prisma = require('../lib/prisma');
const { NotFoundError } = require('../middlewares/errorHandler');

// GET /api/clientes
async function listar(req, res) {
  const clientes = await prisma.cliente.findMany({
    include: { referentes: true, _count: { select: { proyectos: true } } },
    orderBy: { nombre: 'asc' },
  });
  res.json(clientes);
}

// GET /api/clientes/:id
async function obtener(req, res) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { referentes: true, proyectos: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!cliente) throw new NotFoundError('Cliente');
  res.json(cliente);
}

// POST /api/clientes
async function crear(req, res) {
  const { referentes = [], ...data } = req.body;
  const cliente = await prisma.cliente.create({
    data: {
      ...data,
      referentes: referentes.length ? { create: referentes } : undefined,
    },
    include: { referentes: true },
  });
  res.status(201).json(cliente);
}

// PUT /api/clientes/:id
async function actualizar(req, res) {
  const id = parseInt(req.params.id);
  const { referentes, ...data } = req.body;

  const cliente = await prisma.cliente.update({
    where: { id },
    data,
    include: { referentes: true },
  });
  res.json(cliente);
}

// DELETE /api/clientes/:id
async function eliminar(req, res) {
  const id = parseInt(req.params.id);
  await prisma.cliente.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
