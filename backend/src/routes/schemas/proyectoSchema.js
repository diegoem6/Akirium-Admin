const Joi = require('joi');

const proyectoSchema = Joi.object({
  nombre:           Joi.string().max(200).required(),
  estado:           Joi.string().valid('FALTA_COTIZAR','FALTA_OC','EN_EJECUCION','FACTURADO','FALTA_COBRAR','COBRADO').default('FALTA_COTIZAR'),
  clienteId:        Joi.number().integer().positive().required(),
  referenteId:      Joi.number().integer().positive().allow(null).optional(),
  numeroOC:         Joi.string().max(100).allow('', null).optional(),
  numeroFactura:    Joi.string().max(100).allow('', null).optional(),
  moneda:           Joi.string().valid('USD', 'UYU').default('USD'),
  cotizacionDolar:  Joi.number().positive().allow(null).optional(),
  tipoIVA:          Joi.string().valid('CERO', 'BASICO').default('BASICO'),
  fechaFacturacion: Joi.date().iso().allow(null).optional(),
  fechaCobroEfectivo: Joi.date().iso().allow(null).optional(),
  subtotalUSD:      Joi.number().min(0).allow(null).optional(),
  subtotalUYU:      Joi.number().min(0).allow(null).optional(),
  observacion:      Joi.string().allow('', null).optional(),
});

const proyectoUpdateSchema = proyectoSchema.fork(
  ['nombre', 'clienteId'],
  (s) => s.optional()
);

module.exports = { proyectoSchema, proyectoUpdateSchema };
