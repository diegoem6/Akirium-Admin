const Joi = require('joi');

const referenteSchema = Joi.object({
  nombre:  Joi.string().max(100).required(),
  mail:    Joi.string().email().allow('', null).optional(),
  celular: Joi.string().max(30).allow('', null).optional(),
});

const clienteSchema = Joi.object({
  nombre:      Joi.string().max(150).required(),
  descripcion: Joi.string().allow('', null).optional(),
  rut:         Joi.string().max(20).allow('', null).optional(),
  referentes:  Joi.array().items(referenteSchema).optional(),
});

const clienteUpdateSchema = clienteSchema;

module.exports = { clienteSchema, clienteUpdateSchema, referenteSchema };
