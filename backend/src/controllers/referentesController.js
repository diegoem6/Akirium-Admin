const prisma = require('../lib/prisma');
const { NotFoundError } = require('../middlewares/errorHandler');

async function listar(req, res) {
  const clienteId = parseInt(req.params.clienteId);
  const referentes = await prisma.referente.findMany({
    where: { clienteId },
    orderBy: { nombre: 'asc' },
  });
  res.json(referentes);
}

async function crear(req, res) {
  const clienteId = parseInt(req.params.clienteId);
  const referente = await prisma.referente.create({
    data: { ...req.body, clienteId },
  });
  res.status(201).json(referente);
}

async function actualizar(req, res) {
  const id = parseInt(req.params.id);
  const referente = await prisma.referente.update({
    where: { id },
    data: req.body,
  });
  res.json(referente);
}

async function eliminar(req, res) {
  const id = parseInt(req.params.id);
  await prisma.referente.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, crear, actualizar, eliminar };
