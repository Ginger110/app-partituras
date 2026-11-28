const { getDB } = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errores');

// Equivalentes en MongoDB de las sentencias DDL de la Etapa 1 (ALTER x2, DROP x1).
// Operaciones de demostración: requieren rol moderador y ENABLE_ADMIN=true.
const estructura = asyncHandler(async (req, res) => {
  if (process.env.ENABLE_ADMIN !== 'true') {
    throw new ApiError(403, 'ADMIN_DESHABILITADO', 'Las operaciones de estructura están deshabilitadas (ENABLE_ADMIN).');
  }
  const tipo = req.body && req.body.tipo;
  const db = getDB();

  if (tipo === 'alter1') {
    // Los usuarios están en TiDB y la API se conecta con un usuario sin permiso de ALTER (mínimo privilegio).
    // La tabla ya tiene created_at (equivale a fecha_registro); los cambios de estructura se hacen en db/schema.sql.
    throw new ApiError(409, 'DDL_NO_PERMITIDO', 'La tabla usuarios está en TiDB: la API no tiene permiso de ALTER. La columna created_at ya cumple el rol de fecha_registro.');
  }
  if (tipo === 'alter2') {
    // ALTER TABLE partitura MODIFY precio DECIMAL(10,2)  ->  convertir el campo a Decimal128
    const r = await db.collection('partituras').updateMany({}, [{ $set: { precio: { $toDecimal: '$precio' } } }]);
    return res.json({ tipo, mensaje: 'Campo precio convertido a Decimal128 en partituras.', modificados: r.modifiedCount });
  }
  if (tipo === 'drop') {
    // DROP TABLE rating  ->  eliminar la colección (se restaura con: npm run seed)
    const existia = await db.collection('ratings').drop().catch(() => false);
    return res.json({ tipo, mensaje: existia ? 'Colección ratings eliminada. Restaurar con npm run seed.' : 'La colección ratings no existía.' });
  }
  throw new ApiError(400, 'DATOS_INVALIDOS', 'tipo debe ser "alter1", "alter2" o "drop".');
});

module.exports = { estructura };
