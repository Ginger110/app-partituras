const CatalogoModel = require('../models/CatalogoModel');
const ObraModel = require('../models/ObraModel');
const { ApiError, asyncHandler } = require('../utils/errores');
const { parseId } = require('../utils/ids');
const { presentarCatalogo, presentarObra, presentarPartitura } = require('../utils/presentadores');

const listarObras = asyncHandler(async (req, res) => res.json((await ObraModel.listar()).map(presentarObra)));

const listarCatalogos = asyncHandler(async (req, res) => res.json((await CatalogoModel.listar()).map((c) => presentarCatalogo(c))));

// GET /catalogos/:id -> catálogo con sus partituras completas (JOIN con $lookup), en el orden del catálogo
const obtenerCatalogo = asyncHandler(async (req, res) => {
  const c = await CatalogoModel.conDetalle(parseId(req.params.id));
  if (!c) throw new ApiError(404, 'CATALOGO_NO_ENCONTRADO', 'No existe un catálogo con ese id.');
  const porId = new Map(c.detalle.map((p) => [p._id.toString(), p]));
  const partituras = c.partituras.map((ref) => porId.get(ref._id.toString())).filter(Boolean).map(presentarPartitura);
  res.json(presentarCatalogo(c, partituras));
});

module.exports = { listarObras, listarCatalogos, obtenerCatalogo };
