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
    // ALTER TABLE usuario ADD COLUMN fecha_registro  ->  agregar el campo a los documentos que no lo tienen
    const r = await db.collection('usuarios').updateMany({ fecha_registro: { $exists: false } }, { $set: { fecha_registro: new Date() } });
    return res.json({ tipo, mensaje: 'Campo fecha_registro agregado a usuarios.', modificados: r.modifiedCount });
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
