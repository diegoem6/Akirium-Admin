// Devuelve un middleware que valida req.body con el schema Joi dado
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return next(error);
    req.body = value;
    next();
  };
}

// Valida query params
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
    });
    if (error) return next(error);
    req.query = value;
    next();
  };
}

module.exports = { validate, validateQuery };
