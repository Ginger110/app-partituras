const { ApiError } = require('../utils/errores');
const UsuarioModel = require('../models/UsuarioModel');
const { leerToken } = require('./authMiddleware');

// Si llega un JWT válido (Authorization: Bearer), se actúa como ese usuario.
// Sin token, la API sigue actuando como el "usuario demo" (DEMO_USER_EMAIL) o el indicado en X-Demo-Usuario.
async function conUsuario(req, res, next) {
  try {
    const sesion = leerToken(req);
    if (sesion) {
      const usuario = await UsuarioModel.porId(sesion._id);
      if (!usuario) throw new ApiError(401, 'USUARIO_NO_ENCONTRADO', 'La cuenta del token ya no existe.');
      req.usuario = usuario;
      return next();
    }
    const email = String(req.get('x-demo-usuario') || process.env.DEMO_USER_EMAIL || 'camila.rojas@example.com').toLowerCase();
    const usuario = await UsuarioModel.porEmail(email);
    if (!usuario) throw new ApiError(401, 'USUARIO_NO_ENCONTRADO', `No existe el usuario ${email}.`);
    req.usuario = usuario;
    next();
  } catch (e) {
    next(e);
  }
}

function requerirModerador(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'moderador') {
    return next(new ApiError(403, 'SIN_PERMISO', 'Esta acción requiere el rol moderador.'));
  }
  next();
}

module.exports = { conUsuario, requerirModerador };
