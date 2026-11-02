const { getDB } = require('../config/db');

const col = () => getDB().collection('ratings');

// Un usuario tiene como máximo un rating por partitura (índice único usuario+partitura): si ya existía, se reemplaza.
async function guardar({ usuario, partitura, valor, nivel_usuario }) {
  const r = await col().findOneAndUpdate(
    { 'usuario._id': usuario._id, 'partitura._id': partitura._id },
    { $set: { usuario, partitura, valor, nivel_usuario } },
    { upsert: true, returnDocument: 'after', includeResultMetadata: true }
  );
  return { rating: r.value, nuevo: !r.lastErrorObject.updatedExisting };
}

const porId = (id) => col().findOne({ _id: id });
const eliminar = (id) => col().deleteOne({ _id: id });
const deLaPartitura = (partituraId) => col().find({ 'partitura._id': partituraId }).toArray();

// GROUP BY: cuántos ratings hay de cada valor y su promedio
async function resumenDe(partituraId) {
  const [r] = await col().aggregate([
    { $match: { 'partitura._id': partituraId } },
    { $group: {
      _id: '$partitura._id',
      total: { $sum: 1 },
      promedio_valor: { $avg: '$valor' },
      menos_exigente: { $sum: { $cond: [{ $eq: ['$valor', -1] }, 1, 0] } },
      igual: { $sum: { $cond: [{ $eq: ['$valor', 0] }, 1, 0] } },
      mas_exigente: { $sum: { $cond: [{ $eq: ['$valor', 1] }, 1, 0] } },
    } },
  ]).toArray();
  return r
    ? { total: r.total, promedio_valor: Math.round(r.promedio_valor * 100) / 100, menos_exigente: r.menos_exigente, igual: r.igual, mas_exigente: r.mas_exigente }
    : { total: 0, promedio_valor: null, menos_exigente: 0, igual: 0, mas_exigente: 0 };
}

module.exports = { guardar, porId, eliminar, deLaPartitura, resumenDe };
