// Convierten documentos de MongoDB a la forma que espera el frontend
// (ids como string, nombres de campo de mockData.js). Nunca exponen la contraseña.

// Decimal128 (tras el ALTER de precio) -> number
const num = (v) => (v === null || v === undefined ? v : typeof v === 'number' ? v : Number(v.toString()));
const idStr = (v) => (v ? v.toString() : v);
const fechaCorta = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d || null);

function presentarPartitura(p) {
  const d = p.dificultad || {};
  return {
    id: idStr(p._id),
    id_obra: idStr(p.obra && p.obra._id),
    nombre: p.nombre,
    obra_nombre: p.obra && p.obra.nombre,
    autor_obra: p.obra && p.obra.autor,
    instrumentacion: p.instrumentacion,
    estilo: p.estilo,
    arreglo: p.arreglo ?? null,
    arreglista: p.arreglista ?? null,
    transcriptor: p.transcriptor ?? null,
    editor: p.editor ?? null,
    url: p.url,
    info: p.info,
    precio: num(p.precio),
    dificultadEstimada: d.estimada,
    dificultadCalculada: d.calculada,
    totalRatings: d.total_ratings || 0,
    // Permite simular el efecto de un rating en el cliente sin descargar todos los ratings
    dificultadSumas: { suma_ponderada: d.suma_ponderada, suma_pesos: d.suma_pesos },
    creada_en: p.creada_en || null,
  };
}

function presentarUsuario(u) {
  return {
    id: idStr(u._id),
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    estilo: u.estilo ?? null,
    nivel_tecnico: num(u.nivel_tecnico),
    nivel_base: num(u.nivel_base),
    instrumento_principal: u.instrumento_principal ?? '',
    instrumentos_secundarios: u.instrumentos_secundarios || [],
    link_portafolio: u.link_portafolio ?? null,
    avatar_url: u.avatar_url ?? null,
    bio: u.bio || '',
  };
}

function presentarObra(o) {
  return {
    id: idStr(o._id),
    nombre: o.nombre,
    autor: o.autor,
    epoca: o.estilo ?? null,
    info: o.info ?? null,
    anno: o.anno ?? null,
    version: o.version ?? null,
    autor_version: o.autor_version ?? null,
    subido_por: o.subido_por ? { id: idStr(o.subido_por._id), nombre: o.subido_por.nombre } : null,
  };
}

function presentarCatalogo(c, partituras) {
  return {
    id: idStr(c._id),
    nombre: c.nombre,
    instrumento: c.instrumento ?? null,
    estilo: c.estilo ?? null,
    autor: c.autor ?? null,
    subido_por: c.subido_por ? { id: idStr(c.subido_por._id), nombre: c.subido_por.nombre } : null,
    partituras: partituras || (c.partituras || []).map((p) => ({ id: idStr(p._id), nombre: p.nombre })),
  };
}

// Entrada de repertorio/favoritos: partitura + datos de la biblioteca del usuario
function presentarItemBiblioteca(b, partitura) {
  return {
    ...presentarPartitura(partitura),
    fecha_agregado: fechaCorta(b.fecha_agregado),
    estado_dominio: b.estado_dominio ?? null,
    calificado: b.mi_calificacion !== null && b.mi_calificacion !== undefined,
    mi_calificacion: b.mi_calificacion ?? null,
  };
}

function presentarRating(r) {
  return {
    id: idStr(r._id),
    id_usuario: idStr(r.usuario && r.usuario._id),
    usuario: r.usuario && r.usuario.nombre,
    id_partitura: idStr(r.partitura && r.partitura._id),
    valor: r.valor,
    nivel_usuario: num(r.nivel_usuario),
  };
}

module.exports = {
  num, presentarPartitura, presentarUsuario, presentarObra, presentarCatalogo, presentarItemBiblioteca, presentarRating,
};
