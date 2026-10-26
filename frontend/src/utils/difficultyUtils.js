/**
 * Utilidades para el Sistema de Cálculo Dinámico de Dificultad Técnica
 * y validaciones de accesibilidad / formularios.
 */

// Escala semántica de niveles técnicos (1.0 a 10.0)
// Emplea variables CSS con fallback para adaptarse dinámicamente al Modo Oscuro / Claro
export const DIFFICULTY_TIERS = {
  PRINCIPIANTE: {
    min: 1.0,
    max: 3.4,
    label: 'Principiante',
    badgeBg: 'var(--diff-principiante-bg, #ECFDF5)',
    badgeText: 'var(--diff-principiante-text, #065F46)',
    badgeBorder: 'var(--diff-principiante-border, #A7F3D0)',
    dotColor: 'var(--diff-principiante-dot, #10B981)',
    description: 'Nivel inicial: lectura básica, posiciones fijas, tempos moderados.'
  },
  INTERMEDIO: {
    min: 3.5,
    max: 5.9,
    label: 'Intermedio',
    badgeBg: 'var(--diff-intermedio-bg, #FFFBEB)',
    badgeText: 'var(--diff-intermedio-text, #92400E)',
    badgeBorder: 'var(--diff-intermedio-border, #FDE68A)',
    dotColor: 'var(--diff-intermedio-dot, #F59E0B)',
    description: 'Nivel medio: cambios de posición, dinámica expresiva, articulaciones variadas.'
  },
  AVANZADO: {
    min: 6.0,
    max: 8.4,
    label: 'Avanzado',
    badgeBg: 'var(--diff-avanzado-bg, #FEF2F2)',
    badgeText: 'var(--diff-avanzado-text, #991B1B)',
    badgeBorder: 'var(--diff-avanzado-border, #FECACA)',
    dotColor: 'var(--diff-avanzado-dot, #EF4444)',
    description: 'Nivel avanzado: gran velocidad técnica, pasajes polifónicos, afinación exigente.'
  },
  VIRTUOSO: {
    min: 8.5,
    max: 10.0,
    label: 'Virtuoso',
    badgeBg: 'var(--diff-virtuoso-bg, #F5F3FF)',
    badgeText: 'var(--diff-virtuoso-text, #5B21B6)',
    badgeBorder: 'var(--diff-virtuoso-border, #DDD6FE)',
    dotColor: 'var(--diff-virtuoso-dot, #8B5CF6)',
    description: 'Nivel concierto: técnica trascendental, resistencia extrema, maestría interpretativa.'
  }
};

/**
 * Obtiene el tier y colores semánticos según el valor de dificultad
 * Cumple con contraste WCAG AA (> 4.5:1)
 */
export function getDifficultyTier(score) {
  const num = typeof score === 'number' ? score : parseFloat(score) || 1.0;
  if (num < 3.5) return DIFFICULTY_TIERS.PRINCIPIANTE;
  if (num < 6.0) return DIFFICULTY_TIERS.INTERMEDIO;
  if (num < 8.5) return DIFFICULTY_TIERS.AVANZADO;
  return DIFFICULTY_TIERS.VIRTUOSO;
}

/**
 * Algoritmo Bayesiano de Cálculo Dinámico de Dificultad
 * 
 * @param {number} dificultadInicial - Dificultad base de la obra (1.0 - 10.0)
 * @param {Array} ratings - Lista de calificaciones relativas recibidas [{ id_usuario, nivel_usuario, valor }]
 *                          donde valor es: -1 (Menos exigente), 0 (Igual), +1 (Más exigente)
 * @returns {number} Nueva dificultad calculada con 1 decimal
 */
export function calcularDificultadDinamica(dificultadInicial, ratings = []) {
  if (!ratings || ratings.length === 0) {
    return Math.round(dificultadInicial * 10) / 10;
  }

  // Constante de confianza inicial (peso equivalente a 3 calificaciones de referencia)
  const K_CONFIDENCIA = 3;
  let sumaPonderada = dificultadInicial * K_CONFIDENCIA;
  let sumaPesos = K_CONFIDENCIA;

  ratings.forEach(r => {
    // Estimación de dificultad percibida por este usuario
    // Si el usuario tiene nivel 4.5 y califica +1 (más exigente), percibe dificultad ~ 5.3
    // Si califica 0 (igual), percibe ~ 4.5
    // Si califica -1 (menos exigente), percibe ~ 3.7
    const delta = 0.8;
    const dificultadPercibida = Math.min(10, Math.max(1, r.nivel_usuario + (r.valor * delta)));

    // El peso del usuario es proporcional a su nivel / experiencia (mínimo 0.8, máximo 2.0)
    const pesoUsuario = Math.max(0.8, Math.min(2.0, r.nivel_usuario / 5.0));

    sumaPonderada += dificultadPercibida * pesoUsuario;
    sumaPesos += pesoUsuario;
  });

  const resultado = sumaPonderada / sumaPesos;
  return Math.round(Math.min(10.0, Math.max(1.0, resultado)) * 10) / 10;
}

/**
 * Recalcula el Nivel Técnico Actual del Usuario a partir de su repertorio aprendido
 * 
 * @param {number} nivelBase - Nivel inicial autodeclarado
 * @param {Array} repertorio - Partituras marcadas como aprendidas
 * @returns {object} { nuevoNivel, delta, mensaje }
 */
export function recalcularNivelUsuario(nivelBase, repertorio = []) {
  if (!repertorio || repertorio.length === 0) {
    return {
      nuevoNivel: nivelBase,
      delta: 0,
      mensaje: 'Nivel base inicial (sin obras en repertorio aún)'
    };
  }

  // Tomamos las dificultades de las piezas dominadas
  const dificultades = repertorio.map(p => p.dificultadCalculada || p.dificultadEstimada || 3.0);
  dificultades.sort((a, b) => b - a); // De mayor a menor

  // Tomamos el top 70% de las piezas más exigentes dominadas
  const topCount = Math.max(1, Math.ceil(dificultades.length * 0.7));
  const topPiezas = dificultades.slice(0, topCount);
  const promedioTop = topPiezas.reduce((acc, curr) => acc + curr, 0) / topPiezas.length;

  // Factor de progresión: combina nivel base (30%) con el promedio de obras dominadas (70%)
  const nivelCalculado = (nivelBase * 0.3) + (promedioTop * 0.7);
  // Bonus por volumen de repertorio (hasta +0.5 por tener 10+ obras)
  const bonusVolumen = Math.min(0.5, (repertorio.length - 1) * 0.05);

  const nuevoNivel = Math.round(Math.min(10.0, Math.max(1.0, nivelCalculado + bonusVolumen)) * 10) / 10;
  const delta = Math.round((nuevoNivel - nivelBase) * 10) / 10;

  return {
    nuevoNivel,
    delta,
    mensaje: delta > 0 
      ? `¡Felicidades! Tu nivel aumentó +${delta} puntos gracias a las obras dominadas.`
      : delta < 0
      ? `Nivel ajustado dinámicamente (-${Math.abs(delta)}).`
      : 'Tu nivel técnico se mantiene consolidado.'
  };
}

/**
 * Validador estricto de URLs para el campo de partituras (CU03)
 */
export function isValidUrl(string) {
  if (!string || typeof string !== 'string') return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validador de requisitos no funcionales de seguridad para contraseñas
 */
export function validatePasswordStrength(password) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

  return {
    isValid,
    checks: {
      minLength: { ok: minLength, label: 'Mínimo 8 caracteres' },
      hasUpper: { ok: hasUpper, label: 'Al menos una mayúscula' },
      hasLower: { ok: hasLower, label: 'Al menos una minúscula' },
      hasNumber: { ok: hasNumber, label: 'Al menos un número' },
      hasSpecial: { ok: hasSpecial, label: 'Un carácter especial (!@#$%...)' }
    }
  };
}
