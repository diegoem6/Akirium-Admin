# DroneOps — Sistema de gestión para empresa de drones

Aplicación full-stack para la administración de una empresa de servicios con drones. Gestión de proyectos, clientes, colaboradores, egresos, impuestos uruguayos y flujo de caja.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Estado/Fetch | Zustand + TanStack Query |
| Formularios | React Hook Form + Zod |
| Gráficos | Recharts |
| Backend | Node.js + Express |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Archivos | Multer (local) |
| Cron | node-cron |

---

## Requisitos previos

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 corriendo localmente (o en Docker)
- **npm** ≥ 9

---

## Instalación paso a paso

### 1. Clonar / descomprimir el proyecto

```bash
unzip drone-app.zip
cd drone-app
```

### 2. Configurar la base de datos

Si tenés PostgreSQL instalado localmente, creá la base de datos:

```bash
psql -U postgres -c "CREATE DATABASE drone_app;"
```

Con Docker, levantás Postgres en un comando:

```bash
docker run --name drone-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=drone_app \
  -p 5432:5432 \
  -d postgres:16
```

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Editá el `.env` y ajustá la `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drone_app"
PORT=3001
NODE_ENV=development
UPLOADS_DIR=./uploads
MAX_FILE_SIZE_MB=10
BCU_CRON_SCHEDULE="0 9 * * 1-5"
```

### 4. Instalar dependencias del backend

```bash
# Dentro de /backend
npm install
```

### 5. Ejecutar migraciones y generar el cliente Prisma

```bash
# Crea las tablas en la BD
npx prisma migrate dev --name init

# Genera el cliente TypeScript/JS
npx prisma generate
```

### 6. Cargar datos de ejemplo (opcional)

```bash
npm run db:seed
```

Esto crea:
- 3 clientes con referentes
- 3 colaboradores (2 socios + 1 empleado con historial de sueldos)
- 6 proyectos en diferentes estados
- 5 egresos
- Cotizaciones BCU de los últimos días

### 7. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

---

## Levantar la aplicación

Abrís **dos terminales**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
→ API corriendo en `http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
→ App corriendo en `http://localhost:5173`

Abrís el navegador en **http://localhost:5173** y listo.

---

## Estructura del proyecto

```
drone-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo de datos completo
│   │   └── seed.js                # Datos de ejemplo
│   └── src/
│       ├── index.js               # Entry point Express
│       ├── lib/
│       │   └── prisma.js          # Cliente Prisma singleton
│       ├── middlewares/
│       │   ├── errorHandler.js    # Manejo global de errores
│       │   ├── validate.js        # Validación Joi
│       │   └── upload.js          # Multer para archivos
│       ├── routes/
│       │   ├── clientes.js
│       │   ├── referentes.js
│       │   ├── colaboradores.js
│       │   ├── proyectos.js
│       │   ├── egresos.js
│       │   ├── impuestos.js
│       │   ├── flujoCaja.js
│       │   ├── dashboard.js
│       │   ├── bcu.js
│       │   └── schemas/           # Schemas Joi de validación
│       ├── controllers/           # Lógica de negocio
│       ├── services/
│       │   ├── bcuService.js      # Integración BCU
│       │   ├── montosService.js   # Cálculo IVA/totales
│       │   └── impuestosService.js # Motor IVA/IRAE/BPS/Patr.
│       └── jobs/
│           └── bcuJob.js          # Cron cotización diaria
│
└── frontend/
    └── src/
        ├── api/
        │   ├── client.js          # Axios configurado
        │   └── index.js           # Módulos por entidad
        ├── components/
        │   ├── Layout.jsx         # Sidebar + estructura
        │   └── ui.jsx             # Componentes reutilizables
        └── pages/
            ├── Dashboard.jsx
            ├── Proyectos.jsx
            ├── ProyectoDetalle.jsx
            ├── Clientes.jsx
            ├── ClienteDetalle.jsx
            ├── Colaboradores.jsx
            ├── ColaboradorDetalle.jsx
            ├── Egresos.jsx
            ├── Impuestos.jsx
            └── FlujoCaja.jsx
```

---

## API Reference

### Clientes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/clientes` | Listar todos |
| GET | `/api/clientes/:id` | Detalle con referentes |
| POST | `/api/clientes` | Crear (acepta `referentes[]`) |
| PUT | `/api/clientes/:id` | Actualizar |
| DELETE | `/api/clientes/:id` | Eliminar (cascade referentes) |
| GET | `/api/clientes/:id/referentes` | Referentes del cliente |
| POST | `/api/clientes/:id/referentes` | Agregar referente |
| PUT | `/api/clientes/:id/referentes/:rid` | Actualizar referente |
| DELETE | `/api/clientes/:id/referentes/:rid` | Eliminar referente |

### Proyectos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/proyectos?estado=X&clienteId=Y` | Listar con filtros |
| GET | `/api/proyectos/:id` | Detalle + montos calculados |
| POST | `/api/proyectos` | Crear |
| PUT | `/api/proyectos/:id` | Actualizar estado/montos |
| DELETE | `/api/proyectos/:id` | Eliminar + archivos |
| POST | `/api/proyectos/:id/archivos` | Subir archivo (multipart) |
| DELETE | `/api/proyectos/:id/archivos/:aid` | Eliminar archivo |

### Colaboradores
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/colaboradores` | Listar todos |
| GET | `/api/colaboradores/:id` | Detalle + historial |
| POST | `/api/colaboradores` | Crear (registra sueldo inicial) |
| PUT | `/api/colaboradores/:id` | Actualizar datos |
| GET | `/api/colaboradores/:id/sueldos` | Historial de sueldos |
| POST | `/api/colaboradores/:id/sueldos` | Registrar nuevo sueldo |

### Egresos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/egresos?tipo=X&estado=Y&desde=Z&hasta=W` | Listar con filtros |
| POST | `/api/egresos` | Crear |
| PUT | `/api/egresos/:id` | Actualizar |
| DELETE | `/api/egresos/:id` | Eliminar |
| POST | `/api/egresos/:id/comprobante` | Subir comprobante |

### Impuestos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/impuestos/:anio` | Todos los meses del año |
| GET | `/api/impuestos/:anio/:mes` | Mes específico (calcula si no existe) |
| PUT | `/api/impuestos/:anio/:mes` | Editar valores reales |
| POST | `/api/impuestos/:anio/:mes/recalcular` | Forzar recálculo |
| POST | `/api/impuestos/:anio/:mes/notas` | Agregar nota |
| DELETE | `/api/impuestos/notas/:id` | Eliminar nota |

### Flujo de caja
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/flujo-caja?anio=2024&moneda=UYU` | Flujo por año y moneda |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard` | KPIs + facturación 6 meses |

### BCU
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/bcu/cotizacion?fecha=YYYY-MM-DD` | Cotización del dólar |
| GET | `/api/bcu/historial?desde=X&hasta=Y` | Historial de cotizaciones |
| POST | `/api/bcu/actualizar` | Forzar fetch desde BCU |

---

## Notas importantes

### Cotización BCU
El sistema intenta obtener la cotización automáticamente del Banco Central del Uruguay todos los días hábiles a las 9:00 AM. La URL que usa es la del WebService público del BCU. Si la conexión falla (por ejemplo en desarrollo sin internet), usa la última cotización guardada en la base de datos. Los datos de ejemplo del seed incluyen cotizaciones de los últimos días.

### Cálculo de montos
Los campos `ivaUSD`, `ivaUYU`, `totalUSD`, `totalUYU` **no se guardan en la base de datos** — se calculan en runtime en cada consulta a partir de `subtotalUSD`/`subtotalUYU` + `tipoIVA` + `cotizacionDolar`. Esto garantiza consistencia si cambia la lógica de cálculo.

### Archivos adjuntos
Los archivos se guardan en `backend/uploads/` organizados por entidad:
- `uploads/proyectos/{proyectoId}/{uuid}.pdf`
- `uploads/egresos/{egresoId}/{uuid}.pdf`

Para producción, reemplazar Multer local por un storage S3/MinIO cambiando solo el middleware `upload.js`.

### Tasas impositivas
Las tasas están en `backend/src/services/impuestosService.js` en el objeto `TASAS`. Son configurables directamente en el código. El sistema siempre permite sobrescribir cualquier valor calculado con un valor real vía la UI de Impuestos.

---

## Próximos pasos sugeridos

- [ ] Autenticación con JWT (login para múltiples usuarios)
- [ ] Export a Excel/PDF de proyectos e informes
- [ ] Notificaciones de cobros próximos por email
- [ ] Migración de storage a S3/MinIO para producción
- [ ] Tests unitarios (Jest para el backend, React Testing Library para el frontend)
- [ ] Deploy con Docker Compose (postgres + backend + frontend en un `docker-compose.yml`)
