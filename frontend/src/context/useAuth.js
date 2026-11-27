import { useContext } from 'react';
import { AuthContext } from './AuthContextInstance';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// Guardia de acción reutilizable: requireAuth(accion, mensaje?) ejecuta la acción si hay sesión;
// si no, abre el login con el mensaje y la ejecuta después de autenticarse.
export function useRequireAuth() {
  return useAuth().requireAuth;
}
