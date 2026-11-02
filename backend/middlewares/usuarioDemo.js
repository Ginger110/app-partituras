const { ApiError } = require('../utils/errores');
const UsuarioModel = require('../models/UsuarioModel');

// Sin pantalla de login en esta etapa: la API actúa como un "usuario demo" fijo (DEMO_USER_EMAIL).
// Para demostrar la autorización por rol se puede indicar otro usuario con el encabezado X-Demo-Usuario (email).
async function conUsuario(req, res, next) {
  try {
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
