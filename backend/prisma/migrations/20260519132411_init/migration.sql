-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('FALTA_COTIZAR', 'FALTA_OC', 'EN_EJECUCION', 'FACTURADO', 'FALTA_COBRAR');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('USD', 'UYU');

-- CreateEnum
CREATE TYPE "TipoIVA" AS ENUM ('CERO', 'BASICO');

-- CreateEnum
CREATE TYPE "TipoColaborador" AS ENUM ('SOCIO', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "TipoEgreso" AS ENUM ('EGRESO', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "EstadoEgreso" AS ENUM ('PAGADO', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('COTIZACION', 'ORDEN_COMPRA', 'FACTURA', 'COMPROBANTE_EGRESO');

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "rut" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referentes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "mail" TEXT,
    "celular" TEXT,
    "clienteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "mail" TEXT,
    "tipo" "TipoColaborador" NOT NULL,
    "fechaAlta" TIMESTAMP(3) NOT NULL,
    "sueldoActual" DOUBLE PRECISION NOT NULL,
    "porcentajeAcciones" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_sueldos" (
    "id" SERIAL NOT NULL,
    "colaboradorId" INTEGER NOT NULL,
    "sueldo" DOUBLE PRECISION NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'UYU',
    "fechaDesde" TIMESTAMP(3) NOT NULL,
    "fechaHasta" TIMESTAMP(3),
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_sueldos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'FALTA_COTIZAR',
    "clienteId" INTEGER NOT NULL,
    "referenteId" INTEGER,
    "numeroOC" TEXT,
    "numeroFactura" TEXT,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "cotizacionDolar" DOUBLE PRECISION,
    "tipoIVA" "TipoIVA" NOT NULL DEFAULT 'BASICO',
    "fechaFacturacion" TIMESTAMP(3),
    "fechaPosibleCobro" TIMESTAMP(3),
    "fechaCobroEfectivo" TIMESTAMP(3),
    "subtotalUSD" DOUBLE PRECISION,
    "subtotalUYU" DOUBLE PRECISION,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoArchivo" NOT NULL,
    "nombre" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimetype" TEXT,
    "tamanio" INTEGER,
    "proyectoId" INTEGER,
    "egresoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egresos" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoEgreso" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "estado" "EstadoEgreso" NOT NULL DEFAULT 'PENDIENTE',
    "colaboradorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "egresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impuestos_mes" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "ivaCalculado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ivaReal" DOUBLE PRECISION,
    "iraeCalculado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iraeReal" DOUBLE PRECISION,
    "patrimonioCalculado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "patrimonioReal" DOUBLE PRECISION,
    "bpsCalculado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bpsReal" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impuestos_mes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_impuesto" (
    "id" SERIAL NOT NULL,
    "impuestosMesId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_impuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones_bcu" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "compra" DOUBLE PRECISION NOT NULL,
    "venta" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotizaciones_bcu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_rut_key" ON "clientes"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_mail_key" ON "colaboradores"("mail");

-- CreateIndex
CREATE UNIQUE INDEX "impuestos_mes_anio_mes_key" ON "impuestos_mes"("anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_bcu_fecha_key" ON "cotizaciones_bcu"("fecha");

-- AddForeignKey
ALTER TABLE "referentes" ADD CONSTRAINT "referentes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_sueldos" ADD CONSTRAINT "historial_sueldos_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_referenteId_fkey" FOREIGN KEY ("referenteId") REFERENCES "referentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_egresoId_fkey" FOREIGN KEY ("egresoId") REFERENCES "egresos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_impuesto" ADD CONSTRAINT "notas_impuesto_impuestosMesId_fkey" FOREIGN KEY ("impuestosMesId") REFERENCES "impuestos_mes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
