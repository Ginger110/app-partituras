// Conexión a la base relacional (TiDB Cloud, compatible con MySQL).
// Todas las consultas usan parámetros (?): el dato llega a la base como valor,
// nunca como parte de la instrucción SQL (evita la inyección SQL).
const mysql = require('mysql2/promise');

let pool = null;

function opciones({ conBase = true } = {}) {
  const faltan = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'].filter((k) => !process.env[k]);
  if (faltan.length) throw new Error(`Faltan variables de entorno de la BD relacional: ${faltan.join(', ')}`);
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: conBase ? (process.env.DB_NAME || 'app_partituras') : undefined,
    // TiDB Cloud Starter exige TLS
    ssl: process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 5),
    timezone: 'Z',
    decimalNumbers: true, // DECIMAL -> number (no string)
    dateStrings: false,
  };
}

async function conectarSQL() {
  if (pool) return pool;
  pool = mysql.createPool(opciones());
  await pool.query('SELECT 1'); // falla aquí si las credenciales, la IP o el TLS están mal
  return pool;
}

function getPool() {
  if (!pool) throw new Error('La base relacional no está inicializada');
  return pool;
}

// Ejecuta una consulta parametrizada y devuelve las filas (o el resultado de INSERT/UPDATE/DELETE)
async function consultar(sql, params = []) {
  const [filas] = await getPool().execute(sql, params);
  return filas;
}

// Ejecuta fn(conexion) dentro de una transacción: todo o nada
async function enTransaccion(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const r = await fn(conn);
    await conn.commit();
    return r;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function cerrarSQL() {
  if (pool) await pool.end();
  pool = null;
}

module.exports = { conectarSQL, getPool, consultar, enTransaccion, cerrarSQL, opciones };
