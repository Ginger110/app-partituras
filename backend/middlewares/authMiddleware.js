const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { ApiError, asyncHandler } = require('../utils/errores');
const UsuarioModel = require('../models/UsuarioModel');

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

const exigirToken = (req) => {
  const sesion = leerToken(req);
  if (!sesion) throw new ApiError(401, 'TOKEN_REQUERIDO', 'Inicia sesión para realizar esta acción.');
  return sesion;
};

// Exige un JWT válido y adjunta req.usuario = { id, email, nombre, _id } (solo el payload, sin consultar la BD)
function authMiddleware(req, res, next) {
  try {
    req.usuario = exigirToken(req);
    next();
  } catch (e) {
    next(e);
  }
}

// Exige un JWT válido y adjunta el documento completo del usuario (sin hashes): lo usan las
// operaciones que necesitan rol, nivel técnico, etc. (subir, calificar, repertorio, favoritos...)
const conUsuarioAutenticado = asyncHandler(async (req, res, next) => {
  const sesion = exigirToken(req);
  const usuario = await UsuarioModel.porId(sesion._id);
  if (!usuario) throw new ApiError(401, 'USUARIO_NO_ENCONTRADO', 'La cuenta del token ya no existe.');
  req.usuario = { ...usuario, id: sesion.id };
  next();
});

// Debe ir después de conUsuarioAutenticado
function requerirModerador(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'moderador') {
    return next(new ApiError(403, 'SIN_PERMISO', 'Esta acción requiere el rol moderador.'));
  }
  next();
}

module.exports = authMiddleware;
module.exports.leerToken = leerToken;
module.exports.conUsuarioAutenticado = conUsuarioAutenticado;
module.exports.requerirModerador = requerirModerador;
