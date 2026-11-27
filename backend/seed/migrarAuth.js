// Actualiza el validador de `usuarios` en una BD ya poblada para aceptar `passwordHash` (registro JWT)
// sin borrar datos. Alternativa a volver a ejecutar `npm run seed`. Requiere permiso collMod (rol dbAdmin).
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { VALIDADORES } = require('./seed');

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI (definirla en backend/.env)');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'app_partituras');
  await db.command({ collMod: 'usuarios', validator: { $jsonSchema: VALIDADORES.usuarios } });
  await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
  console.log('Validador de usuarios actualizado e índice único de email asegurado.');
  await client.close();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
