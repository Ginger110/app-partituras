// Usuarios en la BD relacional (TiDB). El resto del dominio vive en MongoDB y referencia
// al usuario por su id: el mismo ObjectId de 24 caracteres hex que es la PK de `usuarios`.
//
// Todas las consultas son parametrizadas (?): el dato del usuario nunca se concatena en el SQL.
// Hacia el resto de la app, el modelo devuelve objetos con `_id` como ObjectId, igual que antes,
// para que los controladores y los documentos de MongoDB no cambien.
const { ObjectId } = require('mongodb');
const { consultar, enTransaccion } = require('../config/mysql');
const { getDB } = require('../config/db');
const { ApiError } = require('../utils/errores');
const PartituraModel = require('./PartituraModel');

const normalizarEmail = (email) => String(email || '').trim().toLowerCase();
const hex = (id) => String(id); // ObjectId o string -> 'a1b2...'

// Columnas que se pueden escribir desde la app (lista blanca: los nombres de columna nunca vienen del cliente)
const COLUMNAS = ['nombre', 'email', 'rol', 'nivel_tecnico', 'nivel_base', 'estilo', 'link_portafolio',
  'instrumento_principal', 'avatar_url', 'bio'];
const PUBLICAS = `u.id, u.nombre, u.email, u.rol, u.nivel_tecnico, u.nivel_base, u.estilo, u.link_portafolio,
  u.instrumento_principal, u.avatar_url, u.bio, u.created_at`;

// Fila SQL -> objeto con la forma que usaba la app (nunca incluye el hash)
function aObjeto(fila, instrumentos = []) {
  if (!fila) return null;
  const { id, created_at, password_hash, ...resto } = fila; // eslint-disable-line no-unused-vars
  return { _id: new ObjectId(id), ...resto, createdAt: created_at, instrumentos_secundarios: instrumentos };
}

async function instrumentosDe(id) {
  const filas = await consultar('SELECT instrumento FROM usuario_instrumentos WHERE id_usuario = ? ORDER BY instrumento', [hex(id)]);
  return filas.map((f) => f.instrumento);
}

async function porId(id) {
  const [fila] = await consultar(`SELECT ${PUBLICAS} FROM usuarios u WHERE u.id = ?`, [hex(id)]);
  return fila ? aObjeto(fila, await instrumentosDe(fila.id)) : null;
}

async function porEmail(email) {
  const [fila] = await consultar(`SELECT ${PUBLICAS} FROM usuarios u WHERE u.email = ?`, [normalizarEmail(email)]);
  return fila ? aObjeto(fila, await instrumentosDe(fila.id)) : null;
}

// Uso interno del login: incluye el hash, separado según el algoritmo para que authCtrl no cambie
async function porEmailConHash(email) {
  const [fila] = await consultar(`SELECT ${PUBLICAS}, u.password_hash FROM usuarios u WHERE u.email = ?`, [normalizarEmail(email)]);
  if (!fila) return null;
  const h = fila.password_hash;
  const usuario = aObjeto(fila, await instrumentosDe(fila.id));
  return h.startsWith('scrypt$') ? { ...usuario, contrasena_hash: h } : { ...usuario, passwordHash: h };
}

async function existeEmail(email) {
  const [fila] = await consultar('SELECT 1 AS existe FROM usuarios WHERE email = ? LIMIT 1', [normalizarEmail(email)]);
  return !!fila;
}

const duplicado = (e) => e && (e.code === 'ER_DUP_ENTRY' || e.errno === 1062);
const emailEnUso = () => new ApiError(409, 'EMAIL_REGISTRADO', 'Ya existe una cuenta con ese correo.');

// INSERT: recibe el mismo objeto que antes se guardaba en Mongo
async function crear(doc) {
  const id = doc._id ? hex(doc._id) : new ObjectId().toHexString();
  const hash = doc.passwordHash || doc.contrasena_hash;
  if (!hash) throw new Error('crear usuario: falta el hash de la contraseña');
  try {
    await enTransaccion(async (conn) => {
      await conn.execute(
        `INSERT INTO usuarios (id, nombre, email, password_hash, rol, nivel_tecnico, nivel_base,
                               estilo, link_portafolio, instrumento_principal, avatar_url, bio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, doc.nombre, normalizarEmail(doc.email), hash, doc.rol || 'usuario', doc.nivel_tecnico ?? 1, doc.nivel_base ?? 1,
          doc.estilo ?? null, doc.link_portafolio ?? null, doc.instrumento_principal ?? null, doc.avatar_url ?? null, doc.bio ?? null]
      );
      for (const inst of new Set(doc.instrumentos_secundarios || [])) {
        await conn.execute('INSERT INTO usuario_instrumentos (id_usuario, instrumento) VALUES (?, ?)', [id, String(inst)]);
      }
    });
  } catch (e) {
    if (duplicado(e)) throw emailEnUso();
    throw e;
  }
  return porId(id);
}

// UPDATE parcial. `set` usa los mismos nombres de campo que antes ($set de Mongo).
async function actualizar(id, set) {
  const cols = Object.keys(set).filter((k) => COLUMNAS.includes(k));
  const valores = cols.map((k) => (k === 'email' ? normalizarEmail(set[k]) : set[k]));
  try {
    const cambio = await enTransaccion(async (conn) => {
      const [existe] = await conn.execute('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [hex(id)]);
      if (!existe.length) return false;
      if (cols.length) {
        await conn.execute(`UPDATE usuarios SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [...valores, hex(id)]);
      }
      if (Array.isArray(set.instrumentos_secundarios)) {
        await conn.execute('DELETE FROM usuario_instrumentos WHERE id_usuario = ?', [hex(id)]);
        for (const inst of new Set(set.instrumentos_secundarios)) {
          await conn.execute('INSERT INTO usuario_instrumentos (id_usuario, instrumento) VALUES (?, ?)', [hex(id), String(inst)]);
        }
      }
      return true;
    });
    return cambio ? porId(id) : null;
  } catch (e) {
    if (duplicado(e)) throw emailEnUso();
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Consultas entre ambas BD
// ---------------------------------------------------------------------------

// Datos públicos de varios usuarios en UNA consulta (WHERE id IN (?, ?, ...)), para completar
// documentos de MongoDB (ratings, obras, catálogos) sin el problema N+1.
async function resumenPorIds(ids) {
  const unicos = [...new Set(ids.filter(Boolean).map(hex))];
  if (!unicos.length) return new Map();
  const filas = await consultar(
    `SELECT id, nombre, rol, nivel_tecnico, avatar_url FROM usuarios WHERE id IN (${unicos.map(() => '?').join(', ')})`,
    unicos
  );
  return new Map(filas.map((f) => [f.id, f]));
}

// Borrado en cascada entre bases: primero el contenido en MongoDB y después la fila en TiDB.
// (Si fallara la parte SQL, el usuario sigue existiendo sin contenido; nunca queda contenido huérfano.)
async function eliminarConReferencias(id) {
  const db = getDB();
  const oid = new ObjectId(hex(id));
  if (!(await porId(oid))) return null;

  const obraIds = (await db.collection('obras').find({ 'subido_por._id': oid }, { projection: { _id: 1 } }).toArray()).map((o) => o._id);
  const catIds = (await db.collection('catalogos').find({ 'subido_por._id': oid }, { projection: { _id: 1 } }).toArray()).map((c) => c._id);
  const partIds = (await db.collection('partituras').find({ 'obra._id': { $in: obraIds } }, { projection: { _id: 1 } }).toArray()).map((p) => p._id);

  // Partituras de otros que este usuario calificó: hay que recalcular su dificultad al borrar sus ratings
  const calificadas = await db.collection('ratings').distinct('partitura._id', { 'usuario._id': oid });
  const afectadas = calificadas.filter((pid) => !partIds.some((x) => x.equals(pid)));

  const r = {};
  r.ratings = (await db.collection('ratings').deleteMany({ $or: [{ 'usuario._id': oid }, { 'partitura._id': { $in: partIds } }] })).deletedCount;
  r.biblioteca = (await db.collection('biblioteca').deleteMany({ $or: [{ usuario_id: oid }, { 'recurso._id': { $in: [...obraIds, ...catIds, ...partIds] } }] })).deletedCount;
  await db.collection('catalogos').updateMany({ 'partituras._id': { $in: partIds } }, { $pull: { partituras: { _id: { $in: partIds } } } });
  r.partituras = (await db.collection('partituras').deleteMany({ _id: { $in: partIds } })).deletedCount;
  r.obras = (await db.collection('obras').deleteMany({ _id: { $in: obraIds } })).deletedCount;
  r.catalogos = (await db.collection('catalogos').deleteMany({ _id: { $in: catIds } })).deletedCount;
  for (const pid of afectadas) await PartituraModel.recalcularDificultad(pid);

  // TiDB: la FK con ON DELETE CASCADE borra también sus instrumentos
  const res = await consultar('DELETE FROM usuarios WHERE id = ?', [hex(id)]);
  r.usuario = res.affectedRows;
  return r;
}

// Los índices y restricciones ahora están declarados en db/schema.sql
const asegurarIndices = async () => {};

module.exports = {
  porId, porEmail, porEmailConHash, existeEmail, crear, actualizar, eliminarConReferencias,
  resumenPorIds, asegurarIndices, normalizarEmail,
};
