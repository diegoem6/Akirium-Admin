const Joi = require('joi');

const colaboradorSchema = Joi.object({
  nombre:            Joi.string().max(100).required(),
  mail:              Joi.string().email().allow('', null).optional(),
  tipo:              Joi.string().valid('SOCIO', 'EMPLEADO').required(),
  fechaAlta:         Joi.date().iso().required(),
  sueldoActual:      Joi.number().min(0).required(),
  porcentajeAcciones: Joi.when('tipo', {
    is: 'SOCIO',
    then: Joi.number().min(0).max(100).optional(),
    otherwise: Joi.forbidden(),
  }),
});

const colaboradorUpdateSchema = Joi.object({
  nombre:            Joi.string().max(100).optional(),
  mail:              Joi.string().email().allow('', null).optional(),
  tipo:              Joi.string().valid('SOCIO', 'EMPLEADO').optional(),
  fechaAlta:         Joi.date().iso().optional(),
  sueldoActual:      Joi.number().min(0).optional(),
  porcentajeAcciones: Joi.number().min(0).max(100).allow(null).optional(),
});

const sueldoSchema = Joi.object({
  sueldo:     Joi.number().min(0).required(),
  moneda:     Joi.string().valid('USD', 'UYU').default('UYU'),
  fechaDesde: Joi.date().iso().required(),
  motivo:     Joi.string().allow('', null).optional(),
});

module.exports = { colaboradorSchema, colaboradorUpdateSchema, sueldoSchema };
