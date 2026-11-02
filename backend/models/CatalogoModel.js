const { getDB } = require('../config/db');

const col = () => getDB().collection('catalogos');

const listar = () => col().find().sort({ nombre: 1 }).toArray();

// JOIN ($lookup): catálogo con los documentos completos de sus partituras (precio, dificultad...)
async function conDetalle(id) {
  const [c] = await col().aggregate([
    { $match: { _id: id } },
    { $lookup: { from: 'partituras', localField: 'partituras._id', foreignField: '_id', as: 'detalle' } },
  ]).toArray();
  return c || null;
}

module.exports = { listar, conDetalle };
