const crypto = require('crypto');

// Hash de contraseñas con scrypt (incluido en Node, sin dependencias). Formato: scrypt$salt$hash
function hashear(clave) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(clave, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verificar(clave, almacenado) {
  const [alg, salt, hash] = String(almacenado).split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const calculado = crypto.scryptSync(clave, salt, 64);
  const esperado = Buffer.from(hash, 'hex');
  return calculado.length === esperado.length && crypto.timingSafeEqual(calculado, esperado);
}

module.exports = { hashear, verificar };
