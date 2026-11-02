// Carga los datos de seed/data en MongoDB y crea validaciones e índices.
// Uso:  npm run seed        (usa MONGODB_URI y MONGODB_DB del archivo .env)
// ATENCIÓN: borra y recrea las colecciones cada vez que se ejecuta.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');

const COLECCIONES = ['usuarios', 'obras', 'catalogos', 'partituras', 'ratings', 'biblioteca'];

// Validación de esquema (reemplaza NOT NULL, ENUM y parte de las FK del modelo relacional)
const VALIDADORES = {
  usuarios: {
    bsonType: 'object',
    required: ['nombre', 'email', 'contrasena_hash', 'rol', 'nivel_tecnico', 'nivel_base'],
    properties: {
      rol: { enum: ['usuario', 'moderador'] },
      nivel_tecnico: { bsonType: 'number', minimum: 1, maximum: 10 },
      nivel_base: { bsonType: 'number', minimum: 1, maximum: 10 },
    },
  },
  partituras: {
    bsonType: 'object',
    required: ['nombre', 'estilo', 'instrumentacion', 'obra', 'url', 'info', 'precio', 'dificultad'],
    properties: {
      precio: { bsonType: 'number', minimum: 0 },
      dificultad: {
        bsonType: 'object',
        required: ['estimada', 'calculada', 'suma_ponderada', 'suma_pesos', 'total_ratings'],
        properties: { estimada: { bsonType: 'number', minimum: 1, maximum: 10 } },
      },
    },
  },
  ratings: {
    bsonType: 'object',
    required: ['usuario', 'partitura', 'valor', 'nivel_usuario'],
    properties: { valor: { enum: [-1, 0, 1] } },
  },
  biblioteca: {
    bsonType: 'object',
    required: ['usuario_id', 'lista', 'recurso'],
    properties: {
      lista: { enum: ['repertorio', 'guardados'] },
      recurso: {
        bsonType: 'object',
        required: ['tipo', '_id', 'nombre'],
        properties: { tipo: { enum: ['partitura', 'obra', 'catalogo'] } },
      },
    },
  },
};

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI (definirla en backend/.env)');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'app_partituras');

  for (const nombre of COLECCIONES) {
    await db.collection(nombre).drop().catch(() => {}); // si no existe, se ignora
    if (VALIDADORES[nombre]) {
      await db.createCollection(nombre, { validator: { $jsonSchema: VALIDADORES[nombre] } });
    }
    const docs = EJSON.parse(fs.readFileSync(path.join(__dirname, 'data', `${nombre}.json`), 'utf8'));
    await db.collection(nombre).insertMany(docs);
    console.log(`${nombre}: ${docs.length} documentos`);
  }

  // Índices (uno por consulta frecuente)
  await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });          // reemplaza UNIQUE(email)
  await db.collection('obras').createIndex({ 'subido_por._id': 1 });
  await db.collection('catalogos').createIndex({ 'subido_por._id': 1 });
  await db.collection('catalogos').createIndex({ 'partituras._id': 1 });                // catálogos que contienen una partitura
  await db.collection('partituras').createIndex({ 'obra._id': 1 });                     // partituras de una obra
  await db.collection('partituras').createIndex({ precio: 1 });                         // filtro por precio
  await db.collection('partituras').createIndex({ instrumentacion: 1, estilo: 1 });     // filtros del catálogo
  await db.collection('partituras').createIndex({ 'dificultad.calculada': 1 });         // filtro y orden por dificultad
  await db.collection('partituras').createIndex({ 'dificultad.total_ratings': -1 });    // orden por popularidad
  await db.collection('ratings').createIndex({ 'partitura._id': 1 });                   // ratings de una partitura
  await db.collection('ratings').createIndex(
    { 'usuario._id': 1, 'partitura._id': 1 }, { unique: true }                          // reemplaza la PK compuesta
  );
  await db.collection('biblioteca').createIndex(
    { usuario_id: 1, lista: 1, 'recurso._id': 1 }, { unique: true }                     // repertorio/guardados sin duplicados
  );
  console.log('Índices creados');

  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
