const { getDB } = require('../config/db');
const { getPool } = require('../config/mysql');

// Mide si una base responde y cuánto tarda, sin exponer detalles internos al cliente
async function probar(fn) {
  const t0 = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    console.error('[health]', e.code || '', e.message);
    return { ok: false, ms: Date.now() - t0 };
  }
}

// GET /api/health  → 200 si ambas bases responden, 503 si alguna falla
async function estado(req, res) {
  const [mongodb, tidb] = await Promise.all([
    probar(() => getDB().command({ ping: 1 })),
    probar(() => getPool().query('SELECT 1')),
  ]);
  const ok = mongodb.ok && tidb.ok;
  res.status(ok ? 200 : 503).json({ estado: ok ? 'ok' : 'degradado', bases: { mongodb, tidb }, fecha: new Date().toISOString() });
}

module.exports = { estado };
