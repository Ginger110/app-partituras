const { getDB } = require('../config/db');
const RatingModel = require('./RatingModel');
const { dificultadDesdeRatings } = require('../utils/dificultad');

const col = () => getDB().collection('partituras');
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ORDENES = {
  popularidad: { 'dificultad.total_ratings': -1, _id: -1 },
  dificultad_asc: { 'dificultad.calculada': 1, _id: 1 },
  dificultad_desc: { 'dificultad.calculada': -1, _id: -1 },
  recientes: { creada_en: -1, _id: -1 },
};

// Búsqueda + filtros del catálogo (operadores: $regex, $in, $lte, $gt)
function construirFiltro({ texto, instrumentos, estilos, maxDificultad, tipoPrecio }) {
  const filtro = {};
  if (texto && texto.trim()) {
    const rx = new RegExp(escapar(texto.trim()), 'i');
    filtro.$or = [{ nombre: rx }, { 'obra.nombre': rx }, { 'obra.autor': rx }, { instrumentacion: rx }];
  }
  if (instrumentos && instrumentos.length) filtro.instrumentacion = { $in: instrumentos };
  if (estilos && estilos.length) filtro.estilo = { $in: estilos };
  if (maxDificultad !== null && maxDificultad !== undefined) filtro['dificultad.calculada'] = { $lte: maxDificultad };
  if (tipoPrecio === 'gratis') filtro.precio = 0;
  if (tipoPrecio === 'pago') filtro.precio = { $gt: 0 };
  return filtro;
}

const listar = (f) => col().find(construirFiltro(f)).sort(ORDENES[f.orden] || ORDENES.popularidad).toArray();
const porId = (id) => col().findOne({ _id: id });
const porIds = (ids) => col().find({ _id: { $in: ids } }).toArray();
const crear = async (doc) => { const r = await col().insertOne(doc); return { ...doc, _id: r.insertedId }; };
const actualizarPrecio = (id, precio) => col().updateOne({ _id: id }, { $set: { precio } });

// GROUP BY: opciones del filtro lateral (con cuántas partituras hay en cada una) y resumen de precios
async function facetas() {
  const [r] = await col().aggregate([{ $facet: {
    instrumentaciones: [{ $group: { _id: '$instrumentacion', cantidad: { $sum: 1 } } }, { $sort: { cantidad: -1, _id: 1 } }],
    estilos: [{ $group: { _id: '$estilo', cantidad: { $sum: 1 } } }, { $sort: { cantidad: -1, _id: 1 } }],
    precio: [{ $group: { _id: null, total: { $sum: 1 }, minimo: { $min: '$precio' }, maximo: { $max: '$precio' }, promedio: { $avg: '$precio' } } }],
  } }]).toArray();
  return {
    instrumentaciones: r.instrumentaciones.map((x) => ({ valor: x._id, cantidad: x.cantidad })),
    estilos: r.estilos.map((x) => ({ valor: x._id, cantidad: x.cantidad })),
    precio: r.precio[0] ? { total: r.precio[0].total, minimo: Number(r.precio[0].minimo), maximo: Number(r.precio[0].maximo), promedio: Math.round(Number(r.precio[0].promedio)) } : null,
  };
}

// Recalcula y guarda la dificultad a partir de TODOS los ratings (consistente aunque alguien re-califique o se borre un rating)
async function recalcularDificultad(id) {
  const p = await porId(id);
  if (!p) return null;
  const ratings = await RatingModel.deLaPartitura(id);
  const dificultad = dificultadDesdeRatings(p.dificultad.estimada, ratings);
  await col().updateOne({ _id: id }, { $set: { dificultad } });
  return { ...p, dificultad };
}

// Equivalente al DELETE en cascada del modelo relacional: lo hace la aplicación
async function eliminarConReferencias(id) {
  const db = getDB();
  const r = await col().deleteOne({ _id: id });
  if (!r.deletedCount) return null;
  const ratings = await db.collection('ratings').deleteMany({ 'partitura._id': id });
  const biblioteca = await db.collection('biblioteca').deleteMany({ 'recurso.tipo': 'partitura', 'recurso._id': id });
  const catalogos = await db.collection('catalogos').updateMany({ 'partituras._id': id }, { $pull: { partituras: { _id: id } } });
  return { ratings: ratings.deletedCount, biblioteca: biblioteca.deletedCount, catalogos: catalogos.modifiedCount };
}

module.exports = { listar, porId, porIds, crear, actualizarPrecio, facetas, recalcularDificultad, eliminarConReferencias };
