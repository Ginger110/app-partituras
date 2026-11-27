import { useAuth } from '../../context/useAuth';
import { useApp } from '../../context/useApp';

// Solo para vistas exclusivamente privadas (perfil, subir partitura). El resto de la app es pública.
export default function ProtectedRoute({ children, mensaje = 'Inicia sesión para ver esta sección.' }) {
  const { isAuthenticated, verificando, abrirLogin, abrirRegistro } = useAuth();
  const { user } = useApp();

  // Con token pero sin los datos del usuario todavía (las vistas privadas los necesitan)
  if (verificando || (isAuthenticated && !user)) {
    return (
      <div role="status" className="auth-gate">
        <p className="auth-subtitle">Cargando tu sesión…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-gate">
        <h2 className="auth-title">Necesitas una cuenta</h2>
        <p className="auth-subtitle">{mensaje}</p>
        <div className="auth-gate-actions">
          <button type="button" className="btn-primary" onClick={() => abrirLogin()}>Iniciar sesión</button>
          <button type="button" className="btn-secondary" onClick={() => abrirRegistro()}>Registrarse</button>
        </div>
      </div>
    );
  }

  return children;
}
