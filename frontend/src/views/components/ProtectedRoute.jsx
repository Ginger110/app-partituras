import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// La app no usa un router: sin sesión se muestran las pantallas de acceso en lugar del contenido protegido
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, verificando } = useAuth();
  const [pantalla, setPantalla] = useState('login');

  if (verificando) {
    return (
      <div role="status" className="auth-screen">
        <p className="auth-subtitle">Verificando tu sesión…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return pantalla === 'login'
      ? <LoginPage onIrARegistro={() => setPantalla('registro')} />
      : <RegisterPage onIrALogin={() => setPantalla('login')} />;
  }

  return children;
}
