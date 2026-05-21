require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler } = require('./middlewares/errorHandler');
const { authMiddleware } = require('./middlewares/authMiddleware');
const { initBCUJob } = require('./jobs/bcuJob');

// Rutas
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const referentesRoutes = require('./routes/referentes');
const colaboradoresRoutes = require('./routes/colaboradores');
const proyectosRoutes = require('./routes/proyectos');
const egresosRoutes = require('./routes/egresos');
const impuestosRoutes = require('./routes/impuestos');
const flujoCajaRoutes = require('./routes/flujoCaja');
const dashboardRoutes = require('./routes/dashboard');
const bcuRoutes          = require('./routes/bcu');
const liquidacionesRoutes = require('./routes/liquidaciones');
const utilidadesRoutes    = require('./routes/utilidades');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares globales ───────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos estáticamente
app.use('/uploads', express.static(path.resolve(process.env.UPLOADS_DIR || './uploads')));

// ─── Health check ───────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ─── Auth (pública) ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Rutas API (protegidas) ──────────────────────────────────────
app.use('/api', authMiddleware);
app.use('/api/clientes', clientesRoutes);
app.use('/api/clientes', referentesRoutes);         // /api/clientes/:id/referentes
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/egresos', egresosRoutes);
app.use('/api/impuestos', impuestosRoutes);
app.use('/api/flujo-caja', flujoCajaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bcu', bcuRoutes);
app.use('/api/liquidaciones', liquidacionesRoutes);
app.use('/api/utilidades',   utilidadesRoutes);

// ─── Error handler global ───────────────────────────────────────
app.use(errorHandler);

// ─── Arranque ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Servidor corriendo en http://localhost:${PORT}`);
  initBCUJob();
});

module.exports = app;
