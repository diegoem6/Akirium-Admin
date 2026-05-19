/**
 * Calcula los montos derivados de un proyecto.
 * Los subtotales se guardan en BD, el resto se calcula en runtime.
 */
function calcularMontos(proyecto) {
  const { subtotalUSD, subtotalUYU, tipoIVA, cotizacionDolar, moneda } = proyecto;

  const tasaIVA = tipoIVA === 'BASICO' ? 0.22 : 0;

  let ivaUSD = null, ivaUYU = null;
  let totalUSD = null, totalUYU = null;

  if (subtotalUSD != null) {
    ivaUSD   = parseFloat((subtotalUSD * tasaIVA).toFixed(2));
    totalUSD = parseFloat((subtotalUSD + ivaUSD).toFixed(2));
  }

  if (subtotalUYU != null) {
    ivaUYU   = parseFloat((subtotalUYU * tasaIVA).toFixed(2));
    totalUYU = parseFloat((subtotalUYU + ivaUYU).toFixed(2));
  }

  // Si tenemos un subtotal en una moneda y la cotización, calcular la otra
  if (subtotalUSD != null && subtotalUYU == null && cotizacionDolar) {
    const sUYU = parseFloat((subtotalUSD * cotizacionDolar).toFixed(2));
    ivaUYU   = parseFloat((sUYU * tasaIVA).toFixed(2));
    totalUYU = parseFloat((sUYU + ivaUYU).toFixed(2));
  }

  if (subtotalUYU != null && subtotalUSD == null && cotizacionDolar) {
    const sUSD = parseFloat((subtotalUYU / cotizacionDolar).toFixed(2));
    ivaUSD   = parseFloat((sUSD * tasaIVA).toFixed(2));
    totalUSD = parseFloat((sUSD + ivaUSD).toFixed(2));
  }

  return { ivaUSD, ivaUYU, totalUSD, totalUYU, tasaIVA };
}

/**
 * Calcula fecha de posible cobro: 30 días después de la fecha de facturación
 */
function calcularFechaPosibleCobro(fechaFacturacion) {
  if (!fechaFacturacion) return null;
  const d = new Date(fechaFacturacion);
  d.setDate(d.getDate() + 30);
  return d;
}

module.exports = { calcularMontos, calcularFechaPosibleCobro };
