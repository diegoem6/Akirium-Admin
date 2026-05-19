import api from './client';

// ─── Clientes ──────────────────────────────────────────────────
export const clientesApi = {
  listar:    ()           => api.get('/clientes').then(r => r.data),
  obtener:   (id)         => api.get(`/clientes/${id}`).then(r => r.data),
  crear:     (data)       => api.post('/clientes', data).then(r => r.data),
  actualizar:(id, data)   => api.put(`/clientes/${id}`, data).then(r => r.data),
  eliminar:  (id)         => api.delete(`/clientes/${id}`),
  // Referentes
  listarReferentes: (clienteId)       => api.get(`/clientes/${clienteId}/referentes`).then(r => r.data),
  crearReferente:   (clienteId, data) => api.post(`/clientes/${clienteId}/referentes`, data).then(r => r.data),
  actualizarReferente: (clienteId, id, data) => api.put(`/clientes/${clienteId}/referentes/${id}`, data).then(r => r.data),
  eliminarReferente: (clienteId, id) => api.delete(`/clientes/${clienteId}/referentes/${id}`),
};

// ─── Colaboradores ─────────────────────────────────────────────
export const colaboradoresApi = {
  listar:    ()                 => api.get('/colaboradores').then(r => r.data),
  obtener:   (id)               => api.get(`/colaboradores/${id}`).then(r => r.data),
  crear:     (data)             => api.post('/colaboradores', data).then(r => r.data),
  actualizar:(id, data)         => api.put(`/colaboradores/${id}`, data).then(r => r.data),
  eliminar:  (id)               => api.delete(`/colaboradores/${id}`),
  historialSueldos: (id)        => api.get(`/colaboradores/${id}/sueldos`).then(r => r.data),
  registrarSueldo:  (id, data)  => api.post(`/colaboradores/${id}/sueldos`, data).then(r => r.data),
};

// ─── Proyectos ─────────────────────────────────────────────────
export const proyectosApi = {
  listar:    (params)      => api.get('/proyectos', { params }).then(r => r.data),
  obtener:   (id)          => api.get(`/proyectos/${id}`).then(r => r.data),
  crear:     (data)        => api.post('/proyectos', data).then(r => r.data),
  actualizar:(id, data)    => api.put(`/proyectos/${id}`, data).then(r => r.data),
  eliminar:  (id)          => api.delete(`/proyectos/${id}`),
  subirArchivo: (id, formData) =>
    api.post(`/proyectos/${id}/archivos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  eliminarArchivo: (proyectoId, archivoId) =>
    api.delete(`/proyectos/${proyectoId}/archivos/${archivoId}`),
};

// ─── Egresos ───────────────────────────────────────────────────
export const egresosApi = {
  listar:    (params)      => api.get('/egresos', { params }).then(r => r.data),
  obtener:   (id)          => api.get(`/egresos/${id}`).then(r => r.data),
  crear:     (data)        => api.post('/egresos', data).then(r => r.data),
  actualizar:(id, data)    => api.put(`/egresos/${id}`, data).then(r => r.data),
  eliminar:  (id)          => api.delete(`/egresos/${id}`),
  subirComprobante: (id, formData) =>
    api.post(`/egresos/${id}/comprobante`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
};

// ─── Impuestos ─────────────────────────────────────────────────
export const impuestosApi = {
  getAnio:     (anio)           => api.get(`/impuestos/${anio}`).then(r => r.data),
  getMes:      (anio, mes)      => api.get(`/impuestos/${anio}/${mes}`).then(r => r.data),
  actualizar:  (anio, mes, data)=> api.put(`/impuestos/${anio}/${mes}`, data).then(r => r.data),
  recalcular:  (anio, mes)      => api.post(`/impuestos/${anio}/${mes}/recalcular`).then(r => r.data),
  agregarNota: (anio, mes, texto) => api.post(`/impuestos/${anio}/${mes}/notas`, { texto }).then(r => r.data),
  eliminarNota:(notaId)         => api.delete(`/impuestos/notas/${notaId}`),
};

// ─── Flujo de caja ─────────────────────────────────────────────
export const flujoCajaApi = {
  get: (anio, moneda) => api.get('/flujo-caja', { params: { anio, moneda } }).then(r => r.data),
};

// ─── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data),
};

// ─── BCU ───────────────────────────────────────────────────────
export const bcuApi = {
  cotizacion: (fecha) => api.get('/bcu/cotizacion', { params: fecha ? { fecha } : {} }).then(r => r.data),
  actualizar: () => api.post('/bcu/actualizar').then(r => r.data),
};

// ─── Liquidaciones ─────────────────────────────────────────────
export const liquidacionesApi = {
  get:          (anio, mes)               => api.get(`/liquidaciones/${anio}/${mes}`).then(r => r.data),
  actualizar:   (anio, mes, colabId, data) => api.put(`/liquidaciones/${anio}/${mes}/${colabId}`, data).then(r => r.data),
  pagar:        (anio, mes, colabId)       => api.post(`/liquidaciones/${anio}/${mes}/${colabId}/pagar`).then(r => r.data),
  revertirPago: (anio, mes, colabId)       => api.delete(`/liquidaciones/${anio}/${mes}/${colabId}/pago`),
};
