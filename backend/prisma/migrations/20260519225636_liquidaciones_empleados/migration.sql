-- CreateTable
CREATE TABLE "liquidaciones_empleados" (
    "id" SERIAL NOT NULL,
    "colaboradorId" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "brutoCalculado" DOUBLE PRECISION NOT NULL,
    "bpsCalculado" DOUBLE PRECISION NOT NULL,
    "irpfCalculado" DOUBLE PRECISION NOT NULL,
    "netoCalculado" DOUBLE PRECISION NOT NULL,
    "patronalCalculado" DOUBLE PRECISION NOT NULL,
    "costoTotalCalculado" DOUBLE PRECISION NOT NULL,
    "brutoReal" DOUBLE PRECISION,
    "bpsReal" DOUBLE PRECISION,
    "irpfReal" DOUBLE PRECISION,
    "netoReal" DOUBLE PRECISION,
    "patronalReal" DOUBLE PRECISION,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "egresoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_empleados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liquidaciones_empleados_colaboradorId_anio_mes_key" ON "liquidaciones_empleados"("colaboradorId", "anio", "mes");

-- AddForeignKey
ALTER TABLE "liquidaciones_empleados" ADD CONSTRAINT "liquidaciones_empleados_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
