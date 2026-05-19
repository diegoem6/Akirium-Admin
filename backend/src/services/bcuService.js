const axios = require('axios');
const prisma = require('../lib/prisma');

/**
 * El BCU expone un WebService SOAP, pero también tiene una URL simple
 * para cotizaciones. Usamos el endpoint público del BCU que devuelve
 * el tipo de cambio del dólar.
 *
 * URL: https://cotizaciones.bcu.gub.uy/wscotizaciones/Service.svc/[endpoint]
 * También podemos usar la API REST informal: 
 * https://apis.bcu.gub.uy/cotizaciones_monedas.aspx?moneda=2225&fechaDesde=DD/MM/YYYY&fechaHasta=DD/MM/YYYY
 */

const BCU_BASE = 'https://cotizaciones.bcu.gub.uy/wscotizaciones/Service.svc';

/**
 * Formatea una fecha como DD/MM/YYYY para el BCU
 */
function formatFechaBCU(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Obtiene la cotización del dólar del BCU para una fecha dada.
 * Intenta primero la fecha exacta, si no hay datos retrocede hasta 3 días
 * (fines de semana y feriados no tienen cotización).
 */
async function obtenerCotizacionBCU(fecha = new Date()) {
  const fechaDate = new Date(fecha);

  // Intentar hasta 5 días hacia atrás (puede ser feriado largo)
  for (let intento = 0; intento < 5; intento++) {
    const d = new Date(fechaDate);
    d.setDate(d.getDate() - intento);
    const fechaStr = formatFechaBCU(d);

    try {
      // El BCU tiene una API SOAP, pero existe esta URL pública
      const url = `https://cotizaciones.bcu.gub.uy/wscotizaciones/Service.svc/cotizaciones?` +
        `moneda=2225&fechaDesde=${fechaStr}&fechaHasta=${fechaStr}`;

      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;

      // La respuesta tiene la forma: { cotizaciones: [{ ... }] } o similar
      // El formato real del BCU devuelve XML o JSON según el endpoint
      // Usamos el parser correspondiente
      if (data && data.cotizaciones && data.cotizaciones.length > 0) {
        const cot = data.cotizaciones[0];
        return {
          fecha: d,
          compra: parseFloat(cot.compra || cot.Compra),
          venta:  parseFloat(cot.venta  || cot.Venta),
        };
      }
    } catch (e) {
      // Si falla la petición al BCU, continuar con el siguiente intento
      console.warn(`BCU: fallo intento ${intento + 1} para ${fechaStr}:`, e.message);
    }
  }

  // Si todos los intentos fallan, buscar el último valor guardado en BD
  const ultima = await prisma.cotizacionBCU.findFirst({
    orderBy: { fecha: 'desc' },
  });
  if (ultima) {
    console.warn('BCU: usando cotización cacheada de', ultima.fecha);
    return { fecha: ultima.fecha, compra: ultima.compra, venta: ultima.venta };
  }

  throw new Error('No se pudo obtener la cotización del BCU');
}

/**
 * Guarda (o actualiza) la cotización del día en la BD.
 * Retorna el registro guardado.
 */
async function guardarCotizacion(cotizacion) {
  const fechaOnly = new Date(cotizacion.fecha);
  fechaOnly.setHours(0, 0, 0, 0);

  return prisma.cotizacionBCU.upsert({
    where: { fecha: fechaOnly },
    create: { fecha: fechaOnly, compra: cotizacion.compra, venta: cotizacion.venta },
    update: { compra: cotizacion.compra, venta: cotizacion.venta },
  });
}

/**
 * Obtiene y persiste la cotización de hoy. Uso típico: cron diario.
 */
async function fetchYGuardarCotizacionHoy() {
  const cotizacion = await obtenerCotizacionBCU(new Date());
  const guardado   = await guardarCotizacion(cotizacion);
  console.log(`✅ BCU cotización actualizada: compra=${guardado.compra} venta=${guardado.venta}`);
  return guardado;
}

/**
 * Devuelve la cotización de una fecha (o la más reciente si no hay exacta).
 */
async function getCotizacionParaFecha(fecha = new Date()) {
  const fechaOnly = new Date(fecha);
  fechaOnly.setHours(0, 0, 0, 0);

  // Buscar en caché primero
  const cached = await prisma.cotizacionBCU.findFirst({
    where: { fecha: { lte: fechaOnly } },
    orderBy: { fecha: 'desc' },
  });

  if (cached) return cached;

  // Si no hay caché, ir a buscar al BCU
  const cot = await obtenerCotizacionBCU(fecha);
  return guardarCotizacion(cot);
}

module.exports = {
  obtenerCotizacionBCU,
  guardarCotizacion,
  fetchYGuardarCotizacionHoy,
  getCotizacionParaFecha,
};
