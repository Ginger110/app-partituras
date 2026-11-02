const { getDB } = require('../config/db');

const col = () => getDB().collection('obras');

const listar = () => col().find().sort({ nombre: 1 }).toArray();
const porId = (id) => col().findOne({ _id: id });
const crear = async (doc) => { const r = await col().insertOne(doc); return { ...doc, _id: r.insertedId }; };

module.exports = { listar, porId, crear };
