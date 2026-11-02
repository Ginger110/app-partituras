// Lógica de dificultad dinámica y nivel técnico.
// Portada desde frontend/src/utils/difficultyUtils.js para que el cálculo quede guardado en la BD
// y no dependa del navegador.

const K_CONFIANZA = 3; // peso del estimado inicial (equivale a 3 calificaciones de referencia)
const DELTA = 0.8;     // cuánto desplaza la percepción un rating de -1 / +1

const redondear = (x) => Math.round(x * 10) / 10;
const limitar = (x, min, max) => Math.min(max, Math.max(min, x));

// Dificultad de una partitura recién creada, sin ratings.
function dificultadInicial(estimada) {
  return {
    estimada,
    calculada: redondear(estimada),
    suma_ponderada: estimada * K_CONFIANZA,
    suma_pesos: K_CONFIANZA,
    total_ratings: 0,
  };
}

// Contribución de un rating (valor: -1 menos exigente, 0 igual, +1 más exigente).
function aporteDeRating(nivelUsuario, valor) {
  const percibida = limitar(nivelUsuario + valor * DELTA, 1, 10);
  const peso = limitar(nivelUsuario / 5.0, 0.8, 2.0);
  return { ponderado: percibida * peso, peso };
}

// Promedio bayesiano: parte del estimado (con peso K) y suma cada rating ponderado por el nivel del usuario.
function dificultadDesdeRatings(estimada, ratings) {
  let sp = estimada * K_CONFIANZA;
  let sw = K_CONFIANZA;
  for (const r of ratings) {
    const a = aporteDeRating(r.nivel_usuario, r.valor);
    sp += a.ponderado;
    sw += a.peso;
  }
  const calculada = ratings.length ? redondear(limitar(sp / sw, 1, 10)) : redondear(estimada);
  return { estimada, calculada, suma_ponderada: sp, suma_pesos: sw, total_ratings: ratings.length };
}

// Nivel técnico del usuario a partir de las dificultades de su repertorio.
function recalcularNivel(nivelBase, dificultades) {
  if (!dificultades.length) {
    return { nuevoNivel: nivelBase, delta: 0, mensaje: 'Nivel base inicial (sin obras en repertorio aún)' };
  }
  const orden = [...dificultades].sort((a, b) => b - a);
  const topCount = Math.max(1, Math.ceil(orden.length * 0.7));
  const top = orden.slice(0, topCount);
  const promedioTop = top.reduce((acc, d) => acc + d, 0) / top.length;
  const nivelCalculado = nivelBase * 0.3 + promedioTop * 0.7;
  const bonusVolumen = Math.min(0.5, (dificultades.length - 1) * 0.05);
  const nuevoNivel = redondear(limitar(nivelCalculado + bonusVolumen, 1, 10));
  return { nuevoNivel, delta: redondear(nuevoNivel - nivelBase), mensaje: null };
}

module.exports = { dificultadInicial, dificultadDesdeRatings, recalcularNivel, redondear };
