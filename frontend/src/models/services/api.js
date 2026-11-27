// Cliente HTTP de la API REST (MongoDB). Reemplaza a models/mockData.js.
// La URL base se configura con VITE_API_URL (ver .env.example).
const BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

// --- Token JWT (localStorage) ---
const TOKEN_KEY = 'scorepulse_token';
export const SESION_EXPIRADA = 'scorepulse:sesion-expirada';

export const tokenStorage = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* almacenamiento no disponible */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* almacenamiento no disponible */ }
  }
};

const CODIGOS_SESION_INVALIDA = ['TOKEN_EXPIRADO', 'TOKEN_INVALIDO', 'TOKEN_REQUERIDO', 'USUARIO_NO_ENCONTRADO'];

async function pedir(ruta, { method = 'GET', body } = {}) {
  const token = tokenStorage.get();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`; // se adjunta automáticamente en cada petición

  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

  const texto = await respuesta.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    // respuesta que no es JSON
  }

  if (!respuesta.ok) {
    // Token vencido o inválido: se cierra la sesión local (AuthContext escucha este evento)
    if (token && (respuesta.status === 401 || respuesta.status === 403) && CODIGOS_SESION_INVALIDA.includes(datos?.error?.codigo)) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(SESION_EXPIRADA));
    }
    throw new ApiError(
      respuesta.status,
      datos?.error?.codigo,
      datos?.error?.mensaje || `Error ${respuesta.status} del servidor.`
    );
  }
  return datos;
}

// Arma el query string omitiendo valores vacíos; los arreglos se envían separados por coma
function queryString(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === '') return;
    if (Array.isArray(valor)) {
      if (valor.length) sp.set(clave, valor.join(','));
      return;
    }
    sp.set(clave, valor);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  // Autenticación (JWT)
  registrar: (datos) => pedir('/auth/register', { method: 'POST', body: datos }),
  iniciarSesion: (credenciales) => pedir('/auth/login', { method: 'POST', body: credenciales }),
  perfil: () => pedir('/auth/perfil'),

  // Usuario actual (el del token; sin token, el usuario demo)
  usuarioActual: () => pedir('/usuarios/me'),
  actualizarPerfil: (campos) => pedir('/usuarios/me', { method: 'PUT', body: campos }),

  // Catálogo
  obras: () => pedir('/obras'),
  partituras: (filtros = {}) => pedir(`/partituras${queryString(filtros)}`),
  facetas: () => pedir('/partituras/facetas'),
  crearPartitura: (datos) => pedir('/partituras', { method: 'POST', body: datos }),
  calificar: (id, valor) => pedir(`/partituras/${id}/ratings`, { method: 'POST', body: { valor } }),

  // Repertorio y favoritos
  repertorio: () => pedir('/usuarios/me/repertorio'),
  agregarRepertorio: (partituraId) => pedir('/usuarios/me/repertorio', { method: 'POST', body: { partituraId } }),
  quitarRepertorio: (id) => pedir(`/usuarios/me/repertorio/${id}`, { method: 'DELETE' }),
  favoritos: () => pedir('/usuarios/me/favoritos'),
  agregarFavorito: (partituraId) => pedir('/usuarios/me/favoritos', { method: 'POST', body: { partituraId } }),
  quitarFavorito: (id) => pedir(`/usuarios/me/favoritos/${id}`, { method: 'DELETE' })
};
