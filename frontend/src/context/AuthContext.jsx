import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './AuthContextInstance';
import { api, tokenStorage, SESION_EXPIRADA } from '../models/services/api';

const MODAL_CERRADO = { abierto: false, modo: 'login', mensaje: '' };

// Sesión JWT: el token vive en localStorage y se valida contra /auth/perfil al cargar la app.
// La navegación es pública; las acciones protegidas pasan por requireAuth, que abre el modal de acceso
// y guarda la acción para ejecutarla después de iniciar sesión.
export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());
  const [usuario, setUsuario] = useState(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [modal, setModal] = useState(MODAL_CERRADO);
  const accionPendiente = useRef(null);

  // Hay token guardado pero aún no se confirmó contra el servidor
  const verificando = !!token && !usuario && !sinConexion;

  const logout = useCallback(() => {
    tokenStorage.clear();
    accionPendiente.current = null;
    setToken(null);
    setUsuario(null);
    setSinConexion(false);
  }, []);

  // Valida el token guardado (puede haber expirado desde la última visita)
  useEffect(() => {
    if (!token || usuario || sinConexion) return undefined;
    let cancelado = false;
    api.perfil()
      .then((u) => { if (!cancelado) setUsuario(u); })
      .catch((e) => {
        if (cancelado) return;
        if (e.status === 0) setSinConexion(true);
        else logout();
      });
    return () => { cancelado = true; };
  }, [token, usuario, sinConexion, logout]);

  // El cliente HTTP avisa cuando el servidor rechaza el token (expirado/inválido)
  useEffect(() => {
    window.addEventListener(SESION_EXPIRADA, logout);
    return () => window.removeEventListener(SESION_EXPIRADA, logout);
  }, [logout]);

  // --- Modal de acceso ---
  const abrirLogin = useCallback((mensaje = '') => setModal({ abierto: true, modo: 'login', mensaje }), []);
  const abrirRegistro = useCallback((mensaje = '') => setModal({ abierto: true, modo: 'registro', mensaje }), []);
  const cambiarModo = useCallback((modo) => setModal((m) => ({ ...m, modo })), []);
  const cerrarAuthModal = useCallback(() => {
    accionPendiente.current = null; // cancelar = descartar la acción que pidió sesión
    setModal(MODAL_CERRADO);
  }, []);

  // Ejecuta la acción si hay sesión; si no, abre el login y la deja pendiente
  const requireAuth = useCallback((accion, mensaje = 'Inicia sesión para realizar esta acción.') => {
    if (token) return accion?.();
    accionPendiente.current = accion || null;
    setModal({ abierto: true, modo: 'login', mensaje });
    return undefined;
  }, [token]);

  // La llama AppContext cuando terminó de cargar los datos del usuario recién autenticado
  const consumirAccionPendiente = useCallback(() => {
    const accion = accionPendiente.current;
    accionPendiente.current = null;
    if (accion) accion();
  }, []);

  const iniciarSesion = useCallback((respuesta) => {
    tokenStorage.set(respuesta.token);
    setUsuario(respuesta.usuario);
    setToken(respuesta.token);
    setModal(MODAL_CERRADO);
    return respuesta.usuario;
  }, []);

  const login = useCallback(
    async (email, password) => iniciarSesion(await api.iniciarSesion({ email, password })),
    [iniciarSesion]
  );

  const register = useCallback(
    async (nombre, email, password) => iniciarSesion(await api.registrar({ nombre, email, password })),
    [iniciarSesion]
  );

  const value = useMemo(
    () => ({
      token, usuario, isAuthenticated: !!token, verificando,
      login, register, logout,
      requireAuth, consumirAccionPendiente,
      authModal: modal, abrirLogin, abrirRegistro, cambiarModo, cerrarAuthModal
    }),
    [token, usuario, verificando, login, register, logout, requireAuth, consumirAccionPendiente, modal, abrirLogin, abrirRegistro, cambiarModo, cerrarAuthModal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
