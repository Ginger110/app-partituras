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

async function pedir(ruta, { method = 'GET', body } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
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
  // Usuario actual (demo)
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
