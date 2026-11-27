const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { ApiError } = require('../utils/errores');

// Devuelve el payload verificado del header "Authorization: Bearer <token>", null si no hay token.
// Lanza ApiError 401 (expirado) o 403 (firma/estructura inválida).
function leerToken(req) {
  const header = req.get('authorization') || '';
  const [esquema, token] = header.split(' ');
  if (esquema !== 'Bearer' || !token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    if (!p || typeof p.id !== 'string' || !ObjectId.isValid(p.id)) throw new Error('payload');
    return { id: p.id, email: p.email, nombre: p.nombre, _id: new ObjectId(p.id) };
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw new ApiError(401, 'TOKEN_EXPIRADO', 'La sesión expiró. Inicia sesión nuevamente.');
    throw new ApiError(403, 'TOKEN_INVALIDO', 'El token de acceso no es válido.');
  }
}

// Exige un JWT válido y adjunta req.usuario = { id, email, nombre, _id }
function authMiddleware(req, res, next) {
  try {
    const usuario = leerToken(req);
    if (!usuario) throw new ApiError(401, 'TOKEN_REQUERIDO', 'Falta el token de acceso (Authorization: Bearer <token>).');
    req.usuario = usuario;
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = authMiddleware;
module.exports.leerToken = leerToken;
