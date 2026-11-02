class ApiError extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function noEncontrado(req, res, next) {
  next(new ApiError(404, 'RUTA_NO_ENCONTRADA', `No existe la ruta ${req.method} ${req.originalUrl}`));
}

// Respuesta de error uniforme: { error: { codigo, mensaje } }
function manejarErrores(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo de la solicitud no es un JSON válido.' } });
  }
  if (err.code === 11000) { // índice único violado (email, rating, biblioteca)
    return res.status(409).json({ error: { codigo: 'DUPLICADO', mensaje: 'Ya existe un registro con esos datos únicos.' } });
  }
  if (err.code === 121) { // el documento no cumple el $jsonSchema de la colección
    return res.status(400).json({ error: { codigo: 'VALIDACION_BD', mensaje: 'El documento no cumple el esquema de la colección.' } });
  }
  console.error(err);
  return res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Error inesperado al consultar la base de datos.' } });
}

module.exports = { ApiError, asyncHandler, noEncontrado, manejarErrores };
