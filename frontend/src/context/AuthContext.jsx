import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContextInstance';
import { api, tokenStorage, SESION_EXPIRADA } from '../models/services/api';

// Sesión JWT: el token vive en localStorage y se valida contra /auth/perfil al cargar la app
export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());
  const [usuario, setUsuario] = useState(null);
  const [sinConexion, setSinConexion] = useState(false);
  // Hay token guardado pero aún no se confirmó contra el servidor
  const verificando = !!token && !usuario && !sinConexion;

  const logout = useCallback(() => {
    tokenStorage.clear();
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
        // Sin conexión: se mantiene el token y la app mostrará su propio error de carga
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

  const iniciarSesion = useCallback((respuesta) => {
    tokenStorage.set(respuesta.token);
    setUsuario(respuesta.usuario);
    setToken(respuesta.token);
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
    () => ({ token, usuario, isAuthenticated: !!token, verificando, login, register, logout }),
    [token, usuario, verificando, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
