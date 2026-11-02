const { ObjectId } = require('mongodb');
const { ApiError } = require('./errores');

// ObjectId.isValid() acepta cualquier string de 12 caracteres, por eso se exige el formato hex de 24.
function parseId(valor, nombre = 'id') {
  if (typeof valor !== 'string' || !/^[0-9a-fA-F]{24}$/.test(valor)) {
    throw new ApiError(400, 'ID_INVALIDO', `El ${nombre} indicado no es válido.`);
  }
  return new ObjectId(valor);
}

module.exports = { parseId };
