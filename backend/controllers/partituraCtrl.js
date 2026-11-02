const PartituraModel = require('../models/PartituraModel');
const ObraModel = require('../models/ObraModel');
const RatingModel = require('../models/RatingModel');
const BibliotecaModel = require('../models/BibliotecaModel');
const { ApiError, asyncHandler } = require('../utils/errores');
const { parseId } = require('../utils/ids');
const { dificultadInicial } = require('../utils/dificultad');
const { presentarPartitura, presentarRating } = require('../utils/presentadores');

const TIPOS_PRECIO = ['todos', 'gratis', 'pago'];
const ORDENES = ['popularidad', 'dificultad_asc', 'dificultad_desc', 'recientes'];
const lista = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const esUrl = (v) => { try { const u = new URL(String(v).trim()); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };

// GET /partituras?q=&instrumentos=a,b&estilos=a,b&maxDificultad=&tipoPrecio=&orden=
const listar = asyncHandler(async (req, res) => {
  const { q, instrumentos, estilos, maxDificultad, tipoPrecio = 'todos', orden = 'popularidad' } = req.query;
  if (q !== undefined && typeof q !== 'string') throw new ApiError(400, 'PARAMETRO_INVALIDO', 'q debe ser un texto.');
  if (!TIPOS_PRECIO.includes(tipoPrecio)) throw new ApiError(400, 'PARAMETRO_INVALIDO', `tipoPrecio debe ser: ${TIPOS_PRECIO.join(', ')}.`);
  if (!ORDENES.includes(orden)) throw new ApiError(400, 'PARAMETRO_INVALIDO', `orden debe ser: ${ORDENES.join(', ')}.`);
  let max = null;
  if (maxDificultad !== undefined && maxDificultad !== '') {
    max = Number(maxDificultad);
    if (Number.isNaN(max) || max < 1 || max > 10) throw new ApiError(400, 'PARAMETRO_INVALIDO', 'maxDificultad debe ser un número entre 1 y 10.');
  }
  const docs = await PartituraModel.listar({ texto: q, instrumentos: lista(instrumentos), estilos: lista(estilos), maxDificultad: max, tipoPrecio, orden });
  res.json(docs.map(presentarPartitura));
});

// GET /partituras/facetas  (GROUP BY)
const facetas = asyncHandler(async (req, res) => res.json(await PartituraModel.facetas()));

// GET /partituras/:id
const obtener = asyncHandler(async (req, res) => {
  const p = await PartituraModel.porId(parseId(req.params.id));
  if (!p) throw new ApiError(404, 'PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id.');
  res.json(presentarPartitura(p));
});

// POST /partituras  (CU03: obra nueva o variante de una obra existente)
const crear = asyncHandler(async (req, res) => {
  const d = req.body || {};
  const usuario = req.usuario;

  const instrumentacion = texto(d.instrumentacion);
  if (!instrumentacion) throw new ApiError(400, 'DATOS_INVALIDOS', 'La instrumentación es obligatoria.');
  if (!esUrl(d.url)) throw new ApiError(400, 'DATOS_INVALIDOS', 'La URL es obligatoria y debe comenzar con http:// o https://.');
  const precio = d.precio === undefined || d.precio === '' ? 0 : Number(d.precio);
  if (!Number.isInteger(precio) || precio < 0) throw new ApiError(400, 'DATOS_INVALIDOS', 'El precio debe ser un entero mayor o igual a 0.');
  const estimada = d.dificultadEstimada === undefined || d.dificultadEstimada === '' ? 4.0 : Number(d.dificultadEstimada);
  if (Number.isNaN(estimada) || estimada < 1 || estimada > 10) throw new ApiError(400, 'DATOS_INVALIDOS', 'La dificultad estimada debe estar entre 1 y 10.');

  let obra;
  let obraCreada = false;
  const modo = d.modo || (d.id_obra ? 'existente' : 'obra_nueva');
  if (modo === 'obra_nueva') {
    const nombreObra = texto(d.nombre_obra);
    const autorObra = texto(d.autor_obra);
    if (!nombreObra || !autorObra) throw new ApiError(400, 'DATOS_INVALIDOS', 'El título de la obra y el compositor son obligatorios.');
    obra = await ObraModel.crear({
      nombre: nombreObra, info: null, estilo: texto(d.estilo) || null, autor: autorObra,
      anno: null, version: null, autor_version: null,
      subido_por: { _id: usuario._id, nombre: usuario.nombre },
    });
    obraCreada = true;
  } else if (modo === 'existente') {
    obra = await ObraModel.porId(parseId(String(d.id_obra), 'id_obra'));
    if (!obra) throw new ApiError(404, 'OBRA_NO_ENCONTRADA', 'No existe la obra seleccionada.');
  } else {
    throw new ApiError(400, 'DATOS_INVALIDOS', 'modo debe ser "obra_nueva" o "existente".');
  }

  const doc = await PartituraModel.crear({
    nombre: texto(d.nombre_partitura) || `${obra.nombre} (${instrumentacion})`,
    estilo: texto(d.estilo) || obra.estilo || 'Sin clasificar',
    instrumentacion,
    obra: { _id: obra._id, nombre: obra.nombre, autor: obra.autor },
    arreglo: texto(d.arreglo) || 'Versión estándar',
    arreglista: texto(d.arreglista) || obra.autor,
    transcriptor: texto(d.transcriptor) || usuario.nombre,
    editor: texto(d.editor) || 'Comunidad Symphonia',
    url: String(d.url).trim(),
    info: texto(d.info) || 'Aportado por usuario.',
    precio,
    dificultad: dificultadInicial(estimada),
    creada_en: new Date(),
  });

  // Igual que en el frontend original: publicar cuenta como un primer rating "igual a mi nivel"
  await RatingModel.guardar({
    usuario: { _id: usuario._id, nombre: usuario.nombre },
    partitura: { _id: doc._id, nombre: doc.nombre },
    valor: 0,
    nivel_usuario: usuario.nivel_tecnico,
  });
  const actualizada = await PartituraModel.recalcularDificultad(doc._id);
  res.status(201).json({ partitura: presentarPartitura(actualizada), obra_creada: obraCreada, obra_id: obra._id.toString() });
});

// PUT /partituras/:id/precio  (UPDATE de la Etapa 1)
const actualizarPrecio = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const precio = Number(req.body && req.body.precio);
  if (!Number.isInteger(precio) || precio < 0) throw new ApiError(400, 'DATOS_INVALIDOS', 'El precio debe ser un entero mayor o igual a 0.');
  const r = await PartituraModel.actualizarPrecio(id, precio);
  if (!r.matchedCount) throw new ApiError(404, 'PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id.');
  res.json({ mensaje: 'Precio actualizado.', id: id.toString(), precio });
});

// DELETE /partituras/:id  (DELETE de la Etapa 1, con limpieza de referencias)
const eliminar = asyncHandler(async (req, res) => {
  const limpieza = await PartituraModel.eliminarConReferencias(parseId(req.params.id));
  if (!limpieza) throw new ApiError(404, 'PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id.');
  res.json({ mensaje: 'Partitura eliminada.', limpieza });
});

// GET /partituras/:id/ratings  (GROUP BY + detalle)
const listarRatings = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!(await PartituraModel.porId(id))) throw new ApiError(404, 'PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id.');
  const [resumen, ratings] = await Promise.all([RatingModel.resumenDe(id), RatingModel.deLaPartitura(id)]);
  res.json({ resumen, ratings: ratings.map(presentarRating) });
});

// POST /partituras/:id/ratings  (CU02) body: { valor: -1 | 0 | 1 }
const calificar = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const valor = req.body && req.body.valor;
  if (![-1, 0, 1].includes(valor)) throw new ApiError(400, 'DATOS_INVALIDOS', 'valor debe ser -1 (menos exigente), 0 (igual) o 1 (más exigente).');
  const partitura = await PartituraModel.porId(id);
  if (!partitura) throw new ApiError(404, 'PARTITURA_NO_ENCONTRADA', 'No existe una partitura con ese id.');
  const usuario = req.usuario;

  const { rating, nuevo } = await RatingModel.guardar({
    usuario: { _id: usuario._id, nombre: usuario.nombre },
    partitura: { _id: partitura._id, nombre: partitura.nombre },
    valor,
    nivel_usuario: usuario.nivel_tecnico, // foto del nivel al momento de calificar
  });
  const actualizada = await PartituraModel.recalcularDificultad(id);
  await BibliotecaModel.setMiCalificacion(usuario._id, id, valor);
  res.status(nuevo ? 201 : 200).json({
    partitura: presentarPartitura(actualizada),
    rating: presentarRating(rating),
    dificultadPrevia: partitura.dificultad.calculada,
    dificultadNueva: actualizada.dificultad.calculada,
  });
});

// DELETE /ratings/:id  (moderación: solo rol moderador)
const eliminarRating = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const rating = await RatingModel.porId(id);
  if (!rating) throw new ApiError(404, 'RATING_NO_ENCONTRADO', 'No existe un rating con ese id.');
  await RatingModel.eliminar(id);
  const partitura = await PartituraModel.recalcularDificultad(rating.partitura._id);
  await BibliotecaModel.limpiarCalificacionesDePartitura(rating.usuario._id, rating.partitura._id);
  res.json({ mensaje: 'Rating eliminado.', partitura: partitura ? presentarPartitura(partitura) : null });
});

module.exports = { listar, facetas, obtener, crear, actualizarPrecio, eliminar, listarRatings, calificar, eliminarRating };
