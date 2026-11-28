const CatalogoModel = require('../models/CatalogoModel');
const ObraModel = require('../models/ObraModel');
const { ApiError, asyncHandler } = require('../utils/errores');
const { parseId } = require('../utils/ids');
const { presentarCatalogo, presentarObra, presentarPartitura } = require('../utils/presentadores');
const { conUsuarios } = require('../utils/cruzar');

// Consultas cruzadas: el "subido_por" se completa con el nombre actual del usuario en TiDB
const listarObras = asyncHandler(async (req, res) => {
  res.json((await conUsuarios(await ObraModel.listar(), 'subido_por')).map(presentarObra));
});

const listarCatalogos = asyncHandler(async (req, res) => {
  res.json((await conUsuarios(await CatalogoModel.listar(), 'subido_por')).map((c) => presentarCatalogo(c)));
});

// GET /catalogos/:id -> catálogo con sus partituras completas (JOIN con $lookup), en el orden del catálogo
const obtenerCatalogo = asyncHandler(async (req, res) => {
  const c = await CatalogoModel.conDetalle(parseId(req.params.id));
  if (!c) throw new ApiError(404, 'CATALOGO_NO_ENCONTRADO', 'No existe un catálogo con ese id.');
  const porId = new Map(c.detalle.map((p) => [p._id.toString(), p]));
  const partituras = c.partituras.map((ref) => porId.get(ref._id.toString())).filter(Boolean).map(presentarPartitura);
  const [conAutor] = await conUsuarios([c], 'subido_por');
  res.json(presentarCatalogo(conAutor, partituras));
});

module.exports = { listarObras, listarCatalogos, obtenerCatalogo };
