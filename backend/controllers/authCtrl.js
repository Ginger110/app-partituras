const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
const { ApiError, asyncHandler } = require('../utils/errores');
const { verificar: verificarScrypt } = require('../utils/clave');
const { presentarUsuario } = require('../utils/presentadores');

const SALT_ROUNDS = 10;
const esEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function firmarToken(usuario) {
  const payload = { id: String(usuario._id), email: usuario.email, nombre: usuario.nombre };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
}

const respuestaAuth = (usuario) => ({ token: firmarToken(usuario), usuario: presentarUsuario(usuario) });

// POST /api/auth/register  body: { nombre, email, password }
const register = asyncHandler(async (req, res) => {
  const { nombre, email, password } = req.body || {};
  if (typeof nombre !== 'string' || !nombre.trim()) throw new ApiError(400, 'DATOS_INVALIDOS', 'El nombre es obligatorio.');
  if (!esEmail(email)) throw new ApiError(400, 'DATOS_INVALIDOS', 'El correo electrónico no es válido.');
  if (typeof password !== 'string' || password.length < 8) throw new ApiError(400, 'DATOS_INVALIDOS', 'La contraseña debe tener al menos 8 caracteres.');

  if (await UsuarioModel.existeEmail(email)) throw new ApiError(409, 'EMAIL_REGISTRADO', 'Ya existe una cuenta con ese correo.');

  const nombreLimpio = nombre.trim();
  let usuario;
  try {
    usuario = await UsuarioModel.crear({
      nombre: nombreLimpio,
      email,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      createdAt: new Date(),
      // Valores por defecto que usa el resto de la app
      rol: 'usuario',
      nivel_tecnico: 1.0,
      nivel_base: 1.0,
      estilo: null,
      link_portafolio: null,
      instrumento_principal: '',
      instrumentos_secundarios: [],
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreLimpio)}&background=random`,
      bio: '',
    });
  } catch (e) {
    // Carrera entre dos registros simultáneos con el mismo email
    if (e.code === 11000) throw new ApiError(409, 'EMAIL_REGISTRADO', 'Ya existe una cuenta con ese correo.');
    throw e;
  }
  res.status(201).json(respuestaAuth(usuario));
});

// POST /api/auth/login  body: { email, password }
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!esEmail(email) || typeof password !== 'string' || !password) {
    throw new ApiError(400, 'DATOS_INVALIDOS', 'Indica correo y contraseña.');
  }

  const doc = await UsuarioModel.porEmailConHash(email);
  let valida = false;
  if (doc && doc.passwordHash) valida = await bcrypt.compare(password, doc.passwordHash);
  else if (doc && doc.contrasena_hash) valida = verificarScrypt(password, doc.contrasena_hash); // usuarios del seed (legado)
  if (!valida) throw new ApiError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');

  const { passwordHash, contrasena_hash, ...usuario } = doc; // eslint-disable-line no-unused-vars
  res.json(respuestaAuth(usuario));
});

// GET /api/auth/perfil  (protegida)
const perfil = asyncHandler(async (req, res) => {
  const usuario = await UsuarioModel.porId(req.usuario._id);
  if (!usuario) throw new ApiError(401, 'USUARIO_NO_ENCONTRADO', 'La cuenta del token ya no existe.');
  res.json(presentarUsuario(usuario));
});

module.exports = { register, login, perfil };
