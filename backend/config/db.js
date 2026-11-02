const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function conectar() {
  if (db) return db;
  if (!process.env.MONGODB_URI) throw new Error('Falta la variable de entorno MONGODB_URI');
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'app_partituras');
  return db;
}

function getDB() {
  if (!db) throw new Error('La base de datos no está inicializada');
  return db;
}

async function cerrar() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { conectar, getDB, cerrar };
