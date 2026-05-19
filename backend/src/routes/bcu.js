const router = require('express').Router();
const { getCotizacionParaFecha, fetchYGuardarCotizacionHoy } = require('../services/bcuService');
const prisma = require('../lib/prisma');

// GET /api/bcu/cotizacion?fecha=YYYY-MM-DD  (sin fecha = hoy)
router.get('/cotizacion', async (req, res) => {
  const fecha = req.query.fecha ? new Date(req.query.fecha) : new Date();
  const cotizacion = await getCotizacionParaFecha(fecha);
  res.json(cotizacion);
});

// GET /api/bcu/historial?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/historial', async (req, res) => {
  const where = {};
  if (req.query.desde) where.fecha = { gte: new Date(req.query.desde) };
  if (req.query.hasta) where.fecha = { ...where.fecha, lte: new Date(req.query.hasta) };

  const historial = await prisma.cotizacionBCU.findMany({
    where,
    orderBy: { fecha: 'desc' },
    take: 90,
  });
  res.json(historial);
});

// POST /api/bcu/actualizar  (fuerza un fetch inmediato)
router.post('/actualizar', async (req, res) => {
  const cotizacion = await fetchYGuardarCotizacionHoy();
  res.json(cotizacion);
});

module.exports = router;
