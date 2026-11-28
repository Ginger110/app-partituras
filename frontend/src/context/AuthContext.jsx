import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './AuthContextInstance';
import { api, SESION_EXPIRADA } from '../models/services/api';

const MODAL_CERRADO = { abierto: false, modo: 'login', mensaje: '' };

// Sesión JWT: el token vive en una cookie HttpOnly (inaccesible desde JS). Al cargar la app se
// consulta /auth/perfil para saber si hay una sesión vigente; en memoria solo quedan los datos públicos.
// La navegación es pública; las acciones protegidas pasan por requireAuth, que abre el modal de acceso
// y guarda la acción para ejecutarla después de iniciar sesión.
export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true); // comprobando la cookie al iniciar
  const [modal, setModal] = useState(MODAL_CERRADO);
  const accionPendiente = useRef(null);

  // Identificador de la sesión actual (AppContext lo usa para recargar los datos del usuario)
  const sesion = usuario?.id ?? null;

  // Limpia el estado local (la cookie ya no sirve o el servidor ya la borró)
  const cerrarSesionLocal = useCallback(() => {
    accionPendiente.current = null;
    setUsuario(null);
  }, []);

  // Pide al servidor que borre la cookie HttpOnly (JS no puede hacerlo) y limpia el estado
  const logout = useCallback(async () => {
    try {
      await api.cerrarSesion();
    } catch {
      // aunque falle la red, la sesión local se cierra igual
    }
    cerrarSesionLocal();
  }, [cerrarSesionLocal]);

  // ¿Hay una cookie de sesión vigente? (puede haber expirado desde la última visita)
  useEffect(() => {
    let cancelado = false;
    api.perfil()
      .then((u) => { if (!cancelado) setUsuario(u); })
      .catch(() => { /* sin sesión o sin conexión: se navega como invitado */ })
      .finally(() => { if (!cancelado) setVerificando(false); });
    return () => { cancelado = true; };
  }, []);

  // El cliente HTTP avisa cuando el servidor rechaza la cookie (expirada/inválida)
  useEffect(() => {
    window.addEventListener(SESION_EXPIRADA, cerrarSesionLocal);
    return () => window.removeEventListener(SESION_EXPIRADA, cerrarSesionLocal);
  }, [cerrarSesionLocal]);

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
    if (sesion) return accion?.();
    accionPendiente.current = accion || null;
    setModal({ abierto: true, modo: 'login', mensaje });
    return undefined;
  }, [sesion]);

  // La llama AppContext cuando terminó de cargar los datos del usuario recién autenticado
  const consumirAccionPendiente = useCallback(() => {
    const accion = accionPendiente.current;
    accionPendiente.current = null;
    if (accion) accion();
  }, []);

  // El servidor ya dejó la cookie; la respuesta solo trae los datos públicos del usuario
  const iniciarSesion = useCallback((respuesta) => {
    setUsuario(respuesta.usuario);
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
      sesion, usuario, isAuthenticated: !!sesion, verificando,
      login, register, logout,
      requireAuth, consumirAccionPendiente,
      authModal: modal, abrirLogin, abrirRegistro, cambiarModo, cerrarAuthModal
    }),
    [sesion, usuario, verificando, login, register, logout, requireAuth, consumirAccionPendiente, modal, abrirLogin, abrirRegistro, cambiarModo, cerrarAuthModal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
