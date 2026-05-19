// prisma/seed.js
// Ejecutar con: node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding base de datos...');

  // ── Admin User ──────────────────────────────────────────────
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hash },
  });
  console.log('✅ Usuario admin creado (user: admin / pass: admin123)');


  // ── Clientes ────────────────────────────────────────────────
  const clienteA = await prisma.cliente.upsert({
    where: { rut: '21234567800' },
    update: {},
    create: {
      nombre: 'Constructora del Sur S.A.',
      descripcion: 'Empresa constructora con proyectos en todo el país',
      rut: '21234567800',
      referentes: {
        create: [
          { nombre: 'Martín Rodríguez', mail: 'mrodriguez@constrsur.com.uy', celular: '099111222' },
          { nombre: 'Ana Fernández',    mail: 'afernandez@constrsur.com.uy', celular: '099333444' },
        ],
      },
    },
    include: { referentes: true },
  });

  const clienteB = await prisma.cliente.upsert({
    where: { rut: '21345678900' },
    update: {},
    create: {
      nombre: 'UTE',
      descripcion: 'Administración Nacional de Usinas y Trasmisiones Eléctricas',
      rut: '21345678900',
      referentes: {
        create: [
          { nombre: 'Carlos Pérez', mail: 'cperez@ute.com.uy', celular: '098555666' },
        ],
      },
    },
    include: { referentes: true },
  });

  const clienteC = await prisma.cliente.upsert({
    where: { rut: '21456789000' },
    update: {},
    create: {
      nombre: 'Ministerio de Transporte y Obras Públicas',
      descripcion: 'MTOP — Inspección de obras viales',
      rut: '21456789000',
      referentes: {
        create: [
          { nombre: 'Laura Gómez', mail: 'lgomez@mtop.gub.uy', celular: '097777888' },
        ],
      },
    },
    include: { referentes: true },
  });

  console.log('✅ Clientes creados');

  // ── Colaboradores ───────────────────────────────────────────
  const socio1 = await prisma.colaborador.upsert({
    where: { mail: 'pablo.suarez@droneops.com.uy' },
    update: {},
    create: {
      nombre: 'Pablo Suárez',
      mail: 'pablo.suarez@droneops.com.uy',
      tipo: 'SOCIO',
      fechaAlta: new Date('2020-01-01'),
      sueldoActual: 120000,
      porcentajeAcciones: 50,
      historialSueldos: {
        create: [{ sueldo: 120000, moneda: 'UYU', fechaDesde: new Date('2020-01-01'), motivo: 'Sueldo inicial socio' }],
      },
    },
  });

  const socio2 = await prisma.colaborador.upsert({
    where: { mail: 'lucia.mendez@droneops.com.uy' },
    update: {},
    create: {
      nombre: 'Lucía Méndez',
      mail: 'lucia.mendez@droneops.com.uy',
      tipo: 'SOCIO',
      fechaAlta: new Date('2020-01-01'),
      sueldoActual: 120000,
      porcentajeAcciones: 50,
      historialSueldos: {
        create: [{ sueldo: 120000, moneda: 'UYU', fechaDesde: new Date('2020-01-01'), motivo: 'Sueldo inicial socio' }],
      },
    },
  });

  const empleado1 = await prisma.colaborador.upsert({
    where: { mail: 'diego.silva@droneops.com.uy' },
    update: {},
    create: {
      nombre: 'Diego Silva',
      mail: 'diego.silva@droneops.com.uy',
      tipo: 'EMPLEADO',
      fechaAlta: new Date('2022-03-01'),
      sueldoActual: 75000,
      historialSueldos: {
        create: [
          { sueldo: 60000, moneda: 'UYU', fechaDesde: new Date('2022-03-01'), fechaHasta: new Date('2023-02-28'), motivo: 'Sueldo inicial' },
          { sueldo: 75000, moneda: 'UYU', fechaDesde: new Date('2023-03-01'), motivo: 'Aumento por desempeño' },
        ],
      },
    },
  });

  console.log('✅ Colaboradores creados');

  // ── Proyectos ───────────────────────────────────────────────
  const hoy = new Date();
  const hace2Meses = new Date(hoy); hace2Meses.setMonth(hoy.getMonth() - 2);
  const hace1Mes   = new Date(hoy); hace1Mes.setMonth(hoy.getMonth() - 1);
  const hace3Meses = new Date(hoy); hace3Meses.setMonth(hoy.getMonth() - 3);

  await prisma.proyecto.createMany({
    skipDuplicates: true,
    data: [
      {
        nombre: 'Inspección puente Río Santa Lucía',
        estado: 'FALTA_COBRAR',
        clienteId: clienteA.id,
        referenteId: clienteA.referentes[0].id,
        moneda: 'USD',
        cotizacionDolar: 41.5,
        tipoIVA: 'BASICO',
        numeroOC: 'OC-2024-001',
        numeroFactura: 'FAC-A-0001',
        subtotalUSD: 4500,
        fechaFacturacion: hace2Meses,
        fechaPosibleCobro: new Date(hace2Meses.getTime() + 30 * 24 * 3600 * 1000),
        observacion: 'Inspección estructural completa con ortofoto incluida',
      },
      {
        nombre: 'Relevamiento líneas de alta tensión — Ruta 5',
        estado: 'EN_EJECUCION',
        clienteId: clienteB.id,
        referenteId: clienteB.referentes[0].id,
        moneda: 'USD',
        cotizacionDolar: 41.8,
        tipoIVA: 'BASICO',
        numeroOC: 'OC-2024-015',
        subtotalUSD: 12000,
        observacion: '3 tramos de 40km cada uno. Entrega en 3 etapas.',
      },
      {
        nombre: 'Ortofoto corredor vial Ruta 1',
        estado: 'FACTURADO',
        clienteId: clienteC.id,
        referenteId: clienteC.referentes[0].id,
        moneda: 'USD',
        cotizacionDolar: 40.9,
        tipoIVA: 'BASICO',
        numeroOC: 'OC-MTOP-2024-008',
        numeroFactura: 'FAC-A-0002',
        subtotalUSD: 8500,
        fechaFacturacion: hace1Mes,
        fechaPosibleCobro: new Date(hace1Mes.getTime() + 30 * 24 * 3600 * 1000),
      },
      {
        nombre: 'Modelo 3D planta industrial — Zona Franca',
        estado: 'FALTA_OC',
        clienteId: clienteA.id,
        referenteId: clienteA.referentes[1].id,
        moneda: 'USD',
        cotizacionDolar: 41.5,
        tipoIVA: 'BASICO',
        subtotalUSD: 3200,
        observacion: 'Pendiente aprobación de OC por gerencia',
      },
      {
        nombre: 'Inspección cubierta galpón logístico',
        estado: 'FALTA_COTIZAR',
        clienteId: clienteB.id,
        moneda: 'UYU',
        tipoIVA: 'BASICO',
      },
      {
        nombre: 'Relevamiento predio agropecuario — Canelones',
        estado: 'FALTA_COBRAR',
        clienteId: clienteA.id,
        moneda: 'UYU',
        cotizacionDolar: 40.5,
        tipoIVA: 'CERO',
        subtotalUYU: 85000,
        fechaFacturacion: hace3Meses,
        fechaPosibleCobro: new Date(hace3Meses.getTime() + 30 * 24 * 3600 * 1000),
        numeroFactura: 'FAC-A-0003',
      },
    ],
  });

  console.log('✅ Proyectos creados');

  // ── Egresos ─────────────────────────────────────────────────
  await prisma.egreso.createMany({
    skipDuplicates: true,
    data: [
      {
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
        descripcion: 'Seguro anual DJI Matrice 300',
        tipo: 'EGRESO',
        monto: 1200,
        moneda: 'USD',
        estado: 'PAGADO',
        colaboradorId: null,
      },
      {
        fecha: new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15),
        descripcion: 'Repuesto hélices + batería',
        tipo: 'EGRESO',
        monto: 18500,
        moneda: 'UYU',
        estado: 'PAGADO',
      },
      {
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), 5),
        descripcion: 'Software Pix4D — licencia anual',
        tipo: 'EGRESO',
        monto: 3500,
        moneda: 'USD',
        estado: 'PENDIENTE',
      },
      {
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), 10),
        descripcion: 'Devolución parcial cliente — factura F-0001',
        tipo: 'DEVOLUCION',
        monto: 500,
        moneda: 'USD',
        estado: 'PAGADO',
        colaboradorId: null,
      },
      {
        fecha: new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1),
        descripcion: 'Viáticos operación — interior del país',
        tipo: 'EGRESO',
        monto: 12000,
        moneda: 'UYU',
        estado: 'PAGADO',
        colaboradorId: empleado1.id,
      },
    ],
  });

  console.log('✅ Egresos creados');

  // ── Cotización BCU (datos de ejemplo) ───────────────────────
  const haceNDias = (n) => {
    const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d;
  };

  const cotizaciones = [
    { dias: 0, compra: 41.20, venta: 41.50 },
    { dias: 1, compra: 41.18, venta: 41.48 },
    { dias: 2, compra: 41.15, venta: 41.45 },
    { dias: 5, compra: 41.10, venta: 41.40 },
    { dias: 6, compra: 41.05, venta: 41.35 },
    { dias: 7, compra: 40.98, venta: 41.28 },
  ];

  for (const c of cotizaciones) {
    await prisma.cotizacionBCU.upsert({
      where: { fecha: haceNDias(c.dias) },
      update: {},
      create: { fecha: haceNDias(c.dias), compra: c.compra, venta: c.venta },
    });
  }

  console.log('✅ Cotizaciones BCU creadas');
  console.log('\n🎉 Seed completado exitosamente');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
