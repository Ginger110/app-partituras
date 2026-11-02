const UsuarioModel = require('../models/UsuarioModel');
const PartituraModel = require('../models/PartituraModel');
const BibliotecaModel = require('../models/BibliotecaModel');
const RatingModel = require('../models/RatingModel');
const { ApiError, asyncHandler } = require('../utils/errores');
const { parseId } = require('../utils/ids');
const { hashear } = require('../utils/clave');
const { recalcularNivel, redondear } = require('../utils/dificultad');
const { presentarUsuario, presentarPartitura, presentarItemBiblioteca, num } = require('../utils/presentadores');

const esEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const nivelValido = (n) => typeof n === 'number' && n >= 1 && n <= 10;

const me = asyncHandler(async (req, res) => res.json(presentarUsuario(req.usuario)));

// PUT /usuarios/me  (perfil editable)
const actualizarMe = asyncHandler(async (req, res) => {
  const d = req.body || {};
  const set = {};
  if (d.nombre !== undefined) {
    if (typeof d.nombre !== 'string' || !d.nombre.trim()) throw new ApiError(400, 'DATOS_INVALIDOS', 'El nombre no puede estar vacío.');
    set.nombre = d.nombre.trim();
  }
  if (d.email !== undefined) {
    if (!esEmail(d.email)) throw new ApiError(400, 'DATOS_INVALIDOS', 'El correo electrónico no es válido.');
    set.email = d.email.trim().toLowerCase();
  }
  if (d.instrumento_principal !== undefined) set.instrumento_principal = String(d.instrumento_principal).trim();
  if (d.link_portafolio !== undefined) set.link_portafolio = String(d.link_portafolio).trim() || null;
  if (d.bio !== undefined) set.bio = String(d.bio);
  if (d.instrumentos_secundarios !== undefined) {
    if (!Array.isArray(d.instrumentos_secundarios)) throw new ApiError(400, 'DATOS_INVALIDOS', 'instrumentos_secundarios debe ser un arreglo.');
    set.instrumentos_secundarios = d.instrumentos_secundarios.map(String);
  }
  if (!Object.keys(set).length) throw new ApiError(400, 'DATOS_INVALIDOS', 'No se indicó ningún campo para actualizar.');
  const actualizado = await UsuarioModel.actualizar(req.usuario._id, set);
  res.json(presentarUsuario(actualizado));
});

// --- Repertorio y favoritos (colección biblioteca) ---
const listarLista = (lista) => asyncHandler(async (req, res) => {
  const items = await BibliotecaModel.deUsuario(req.usuario._id, lista);
  res.json(items.map((b) => (lista === 'repertorio' ? presentarItemBiblioteca(b, b.partitura) : presentarPartitura(b.partitura))));
});

async function partituraDelBody(req) {
  const id = parseId(String((req.body && req.body.partituraId) || ''), 'partituraId');
  const p = await PartituraModel.porId(id);
  if (!p) throw new ApiError(404, 'PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id.');
  return p;
}

// Recalcula y guarda el nivel técnico a partir del repertorio actual (CU01)
async function actualizarNivel(usuario) {
  const items = await BibliotecaModel.deUsuario(usuario._id, 'repertorio');
  const dificultades = items.map((b) => b.partitura.dificultad.calculada || b.partitura.dificultad.estimada || 3.0);
  const base = num(usuario.nivel_base);
  const r = recalcularNivel(base, dificultades);
  const actualizado = await UsuarioModel.actualizar(usuario._id, { nivel_tecnico: r.nuevoNivel });
  return { usuario: actualizado, nuevoNivel: r.nuevoNivel, nivelAnterior: num(usuario.nivel_tecnico), delta: redondear(r.nuevoNivel - num(usuario.nivel_tecnico)) };
}

// POST /usuarios/me/repertorio  body: { partituraId }
const agregarRepertorio = asyncHandler(async (req, res) => {
  const partitura = await partituraDelBody(req);
  const usuario = req.usuario;
  if (await BibliotecaModel.buscar(usuario._id, 'repertorio', partitura._id)) {
    throw new ApiError(409, 'YA_EN_REPERTORIO', 'La partitura ya está en tu repertorio.');
  }
  const previo = await RatingModel.deLaPartitura(partitura._id).then((rs) => rs.find((r) => r.usuario._id.equals(usuario._id)));
  const doc = await BibliotecaModel.agregar({
    usuario_id: usuario._id,
    lista: 'repertorio',
    recurso: { tipo: 'partitura', _id: partitura._id, nombre: partitura.nombre },
    fecha_agregado: new Date(),
    estado_dominio: 'Dominada',
    mi_calificacion: previo ? previo.valor : null,
  });
  const nivel = await actualizarNivel(usuario);
  res.status(201).json({
    item: presentarItemBiblioteca(doc, partitura),
    usuario: presentarUsuario(nivel.usuario),
    nivelAnterior: nivel.nivelAnterior,
    nuevoNivel: nivel.nuevoNivel,
    delta: nivel.delta,
  });
});

// DELETE /usuarios/me/repertorio/:partituraId
const quitarRepertorio = asyncHandler(async (req, res) => {
  const pid = parseId(req.params.partituraId, 'partituraId');
  const r = await BibliotecaModel.quitar(req.usuario._id, 'repertorio', pid);
  if (!r.deletedCount) throw new ApiError(404, 'NO_ESTA_EN_REPERTORIO', 'La partitura no está en tu repertorio.');
  const nivel = await actualizarNivel(req.usuario);
  res.json({ usuario: presentarUsuario(nivel.usuario), nivelAnterior: nivel.nivelAnterior, nuevoNivel: nivel.nuevoNivel, delta: nivel.delta });
});

// POST /usuarios/me/favoritos  body: { partituraId }
const agregarFavorito = asyncHandler(async (req, res) => {
  const partitura = await partituraDelBody(req);
  if (await BibliotecaModel.buscar(req.usuario._id, 'guardados', partitura._id)) {
    throw new ApiError(409, 'YA_EN_FAVORITOS', 'La partitura ya está en tus favoritos.');
  }
  await BibliotecaModel.agregar({
    usuario_id: req.usuario._id,
    lista: 'guardados',
    recurso: { tipo: 'partitura', _id: partitura._id, nombre: partitura.nombre },
    fecha_agregado: new Date(),
  });
  res.status(201).json(presentarPartitura(partitura));
});

// DELETE /usuarios/me/favoritos/:partituraId
const quitarFavorito = asyncHandler(async (req, res) => {
  const r = await BibliotecaModel.quitar(req.usuario._id, 'guardados', parseId(req.params.partituraId, 'partituraId'));
  if (!r.deletedCount) throw new ApiError(404, 'NO_ESTA_EN_FAVORITOS', 'La partitura no está en tus favoritos.');
  res.json({ mensaje: 'Partitura quitada de favoritos.' });
});

// --- Operaciones de la Etapa 1 ---

// POST /usuarios  (INSERT de la Etapa 1)
const crear = asyncHandler(async (req, res) => {
  const d = req.body || {};
  if (typeof d.nombre !== 'string' || !d.nombre.trim()) throw new ApiError(400, 'DATOS_INVALIDOS', 'El nombre es obligatorio.');
  if (!esEmail(d.email)) throw new ApiError(400, 'DATOS_INVALIDOS', 'El correo electrónico no es válido.');
  if (typeof d.contrasena !== 'string' || d.contrasena.length < 8) throw new ApiError(400, 'DATOS_INVALIDOS', 'La contraseña debe tener al menos 8 caracteres.');
  const nivel = d.nivel_tecnico === undefined ? 1.0 : Number(d.nivel_tecnico);
  if (!nivelValido(nivel)) throw new ApiError(400, 'DATOS_INVALIDOS', 'nivel_tecnico debe estar entre 1 y 10.');
  const doc = await UsuarioModel.crear({
    nombre: d.nombre.trim(),
    email: d.email.trim().toLowerCase(),
    contrasena_hash: hashear(d.contrasena),
    rol: 'usuario',
    nivel_tecnico: nivel,
    nivel_base: nivel,
    estilo: d.estilo ? String(d.estilo) : null,
    link_portafolio: d.link_portafolio ? String(d.link_portafolio) : null,
    instrumento_principal: d.instrumento_principal ? String(d.instrumento_principal) : '',
    instrumentos_secundarios: [],
    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nombre.trim())}&background=random`,
    bio: '',
  });
  res.status(201).json(presentarUsuario(doc));
});

// PUT /usuarios/:id/nivel  (UPDATE de la Etapa 1)
const actualizarNivelPorId = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const nivel = req.body && req.body.nivel_tecnico;
  if (!nivelValido(nivel)) throw new ApiError(400, 'DATOS_INVALIDOS', 'nivel_tecnico debe ser un número entre 1 y 10.');
  const actualizado = await UsuarioModel.actualizar(id, { nivel_tecnico: nivel });
  if (!actualizado) throw new ApiError(404, 'USUARIO_NO_ENCONTRADO', 'No existe un usuario con ese id.');
  res.json(presentarUsuario(actualizado));
});

// DELETE /usuarios/:id  (DELETE de la Etapa 1, en cascada; solo moderador)
const eliminar = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const demo = await UsuarioModel.porEmail(String(process.env.DEMO_USER_EMAIL || 'camila.rojas@example.com').toLowerCase());
  if (demo && demo._id.equals(id)) throw new ApiError(409, 'USUARIO_DEMO_PROTEGIDO', 'No se puede eliminar el usuario demo con el que actúa la API.');
  const limpieza = await UsuarioModel.eliminarConReferencias(id);
  if (!limpieza) throw new ApiError(404, 'USUARIO_NO_ENCONTRADO', 'No existe un usuario con ese id.');
  res.json({ mensaje: 'Usuario eliminado.', limpieza });
});

module.exports = {
  me, actualizarMe,
  listarRepertorio: listarLista('repertorio'), agregarRepertorio, quitarRepertorio,
  listarFavoritos: listarLista('guardados'), agregarFavorito, quitarFavorito,
  crear, actualizarNivelPorId, eliminar,
};
