import { useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

// Modal de acceso: se abre desde la Navbar o cuando un visitante intenta una acción protegida
export default function AuthModal() {
  const { authModal, cambiarModo, cerrarAuthModal } = useAuth();
  const { abierto, modo, mensaje } = authModal;

  useEffect(() => {
    if (!abierto) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') cerrarAuthModal(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [abierto, cerrarAuthModal]);

  if (!abierto) return null;
  const esLogin = modo === 'login';

  return (
    <div className="modal-backdrop auth-modal-backdrop" onClick={cerrarAuthModal} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon brand-logo-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className="modal-header-text">
            <h2 id="auth-modal-title" className="modal-title">{esLogin ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
            <p className="modal-subtitle">
              {esLogin ? 'Accede a tu repertorio, favoritos y calificaciones.' : 'Registra tu repertorio y sigue tu nivel técnico.'}
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={cerrarAuthModal} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="auth-modal-body">
          {mensaje && <div className="auth-info" role="status">{mensaje}</div>}
          {esLogin
            ? <LoginForm onIrARegistro={() => cambiarModo('registro')} />
            : <RegisterForm onIrALogin={() => cambiarModo('login')} />}
        </div>
      </div>
    </div>
  );
}
