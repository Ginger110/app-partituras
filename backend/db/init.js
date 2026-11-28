// Crea el esquema relacional en TiDB y carga los usuarios semilla.
// Uso:  npm run db:init            (crea lo que falte y actualiza los usuarios semilla)
//       npm run db:init -- --reset (borra las tablas y las vuelve a crear)
// Necesita un usuario con permisos de CREATE (root del clúster), no el usuario de la app.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { EJSON } = require('bson');
const { opciones } = require('../config/mysql');

const RESET = process.argv.includes('--reset');

// Divide el script en sentencias (sin comentarios ni líneas vacías)
function sentencias(sql) {
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const conn = await mysql.createConnection({ ...opciones({ conBase: false }), connectionLimit: undefined, waitForConnections: undefined });
  const base = process.env.DB_NAME || 'app_partituras';
  try {
    if (RESET) {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${base}\``);
      await conn.query(`USE \`${base}\``);
      await conn.query('DROP TABLE IF EXISTS usuario_instrumentos');
      await conn.query('DROP TABLE IF EXISTS usuarios');
      console.log('Tablas eliminadas (--reset)');
    }

    // 1. Esquema
    const script = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8').replace(/app_partituras/g, base);
    for (const s of sentencias(script)) {
      try {
        await conn.query(s);
      } catch (e) {
        if (s.startsWith('SET GLOBAL tidb_enable_check_constraint')) {
          console.warn('Aviso: no se pudo activar CHECK en TiDB (', e.code, '). Las validaciones igual se hacen en la API.');
        } else if (e.code === 'ER_DUP_KEYNAME') {
          // CREATE INDEX ya existente: el script es idempotente
        } else {
          throw e;
        }
      }
    }
    console.log(`Esquema listo en la base ${base}`);

    // 2. Usuarios semilla (mismos _id que en MongoDB)
    const usuarios = EJSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seed', 'data', 'usuarios.json'), 'utf8'));
    await conn.beginTransaction();
    for (const u of usuarios) {
      const id = u._id.toHexString();
      await conn.execute(
        `INSERT INTO usuarios (id, nombre, email, password_hash, rol, nivel_tecnico, nivel_base,
                               estilo, link_portafolio, instrumento_principal, avatar_url, bio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), rol = VALUES(rol),
           nivel_tecnico = VALUES(nivel_tecnico), nivel_base = VALUES(nivel_base),
           estilo = VALUES(estilo), link_portafolio = VALUES(link_portafolio),
           instrumento_principal = VALUES(instrumento_principal),
           avatar_url = VALUES(avatar_url), bio = VALUES(bio)`,
        [id, u.nombre, String(u.email).trim().toLowerCase(), u.passwordHash || u.contrasena_hash, u.rol,
          u.nivel_tecnico, u.nivel_base, u.estilo ?? null, u.link_portafolio ?? null,
          u.instrumento_principal ?? null, u.avatar_url ?? null, u.bio ?? null]
      );
      for (const inst of u.instrumentos_secundarios || []) {
        await conn.execute('INSERT IGNORE INTO usuario_instrumentos (id_usuario, instrumento) VALUES (?, ?)', [id, String(inst)]);
      }
    }
    await conn.commit();
    const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM usuarios');
    console.log(`Usuarios semilla cargados: ${usuarios.length} (total en la tabla: ${total})`);
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error('Error al inicializar la BD relacional:', e.code || '', e.message);
  process.exit(1);
});
