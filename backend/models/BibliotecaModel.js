const { getDB } = require('../config/db');

const col = () => getDB().collection('biblioteca');

// JOIN ($lookup): entradas de repertorio/guardados del usuario con la partitura completa
const deUsuario = (usuarioId, lista) => col().aggregate([
  { $match: { usuario_id: usuarioId, lista, 'recurso.tipo': 'partitura' } },
  { $lookup: { from: 'partituras', localField: 'recurso._id', foreignField: '_id', as: 'partitura' } },
  { $unwind: '$partitura' },
  { $sort: { fecha_agregado: -1, _id: -1 } },
]).toArray();

const buscar = (usuarioId, lista, partituraId) =>
  col().findOne({ usuario_id: usuarioId, lista, 'recurso.tipo': 'partitura', 'recurso._id': partituraId });

const agregar = async (doc) => { const r = await col().insertOne(doc); return { ...doc, _id: r.insertedId }; };
const quitar = (usuarioId, lista, partituraId) =>
  col().deleteOne({ usuario_id: usuarioId, lista, 'recurso.tipo': 'partitura', 'recurso._id': partituraId });

// Guarda en el repertorio cómo calificó el usuario esa partitura (-1, 0, 1) o null si se borra el rating
const setMiCalificacion = (usuarioId, partituraId, valor) => col().updateOne(
  { usuario_id: usuarioId, lista: 'repertorio', 'recurso.tipo': 'partitura', 'recurso._id': partituraId },
  { $set: { mi_calificacion: valor } }
);
const limpiarCalificacionesDePartitura = (usuarioId, partituraId) => setMiCalificacion(usuarioId, partituraId, null);

module.exports = { deUsuario, buscar, agregar, quitar, setMiCalificacion, limpiarCalificacionesDePartitura };
