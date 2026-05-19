const { Prisma } = require('@prisma/client');

// Clase base para errores de negocio
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 422);
  }
}

// ─── Handler global ─────────────────────────────────────────────
function errorHandler(err, req, res, next) {
  // Error de validación Joi
  if (err.isJoi) {
    return res.status(422).json({
      error: 'Error de validación',
      details: err.details.map(d => d.message),
    });
  }

  // Error de Prisma: registro no encontrado
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un registro con ese valor único', field: err.meta?.target });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Referencia a registro inexistente', field: err.meta?.field_name });
    }
  }

  // Errores operacionales propios
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Error inesperado
  console.error('ERROR NO CONTROLADO:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { errorHandler, AppError, NotFoundError, ValidationError };
