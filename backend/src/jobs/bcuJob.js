const cron = require('node-cron');
const { fetchYGuardarCotizacionHoy } = require('../services/bcuService');

// Por defecto corre a las 9:00 AM de lunes a viernes
const SCHEDULE = process.env.BCU_CRON_SCHEDULE || '0 9 * * 1-5';

function initBCUJob() {
  cron.schedule(SCHEDULE, async () => {
    console.log(`⏰ [BCU Job] Actualizando cotización del dólar...`);
    try {
      await fetchYGuardarCotizacionHoy();
    } catch (err) {
      console.error('[BCU Job] Error al obtener cotización:', err.message);
    }
  });

  console.log(`📅 BCU Job programado: ${SCHEDULE}`);

  // También intentar al arrancar el servidor si no hay dato de hoy
  setTimeout(async () => {
    try {
      await fetchYGuardarCotizacionHoy();
    } catch (_) {
      // Silencioso al arranque, el cron lo reintentará
    }
  }, 3000);
}

module.exports = { initBCUJob };
