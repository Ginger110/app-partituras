const { getDB } = require('../config/db');
const PartituraModel = require('./PartituraModel');

const col = () => getDB().collection('usuarios');

const porId = (id) => col().findOne({ _id: id });
const porEmail = (email) => col().findOne({ email });
const crear = async (doc) => { const r = await col().insertOne(doc); return { ...doc, _id: r.insertedId }; };
const actualizar = async (id, set) => col().findOneAndUpdate({ _id: id }, { $set: set }, { returnDocument: 'after' });

// Equivalente al ON DELETE CASCADE del modelo relacional (usuario -> recurso -> obra -> partitura): lo hace la aplicación
async function eliminarConReferencias(id) {
  const db = getDB();
  if (!(await col().findOne({ _id: id }, { projection: { _id: 1 } }))) return null;

  const obraIds = (await db.collection('obras').find({ 'subido_por._id': id }, { projection: { _id: 1 } }).toArray()).map((o) => o._id);
  const catIds = (await db.collection('catalogos').find({ 'subido_por._id': id }, { projection: { _id: 1 } }).toArray()).map((c) => c._id);
  const partIds = (await db.collection('partituras').find({ 'obra._id': { $in: obraIds } }, { projection: { _id: 1 } }).toArray()).map((p) => p._id);

  // Partituras de otros que este usuario calificó: hay que recalcular su dificultad al borrar sus ratings
  const calificadas = await db.collection('ratings').distinct('partitura._id', { 'usuario._id': id });
  const afectadas = calificadas.filter((pid) => !partIds.some((x) => x.equals(pid)));

  const r = {};
  r.ratings = (await db.collection('ratings').deleteMany({ $or: [{ 'usuario._id': id }, { 'partitura._id': { $in: partIds } }] })).deletedCount;
  r.biblioteca = (await db.collection('biblioteca').deleteMany({ $or: [{ usuario_id: id }, { 'recurso._id': { $in: [...obraIds, ...catIds, ...partIds] } }] })).deletedCount;
  await db.collection('catalogos').updateMany({ 'partituras._id': { $in: partIds } }, { $pull: { partituras: { _id: { $in: partIds } } } });
  r.partituras = (await db.collection('partituras').deleteMany({ _id: { $in: partIds } })).deletedCount;
  r.obras = (await db.collection('obras').deleteMany({ _id: { $in: obraIds } })).deletedCount;
  r.catalogos = (await db.collection('catalogos').deleteMany({ _id: { $in: catIds } })).deletedCount;
  await col().deleteOne({ _id: id });
  for (const pid of afectadas) await PartituraModel.recalcularDificultad(pid);
  return r;
}

module.exports = { porId, porEmail, crear, actualizar, eliminarConReferencias };
