import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import AuthLayout from '../layouts/AuthLayout';

export default function LoginPage({ onIrARegistro }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setEnviando(true);
    try {
      await login(form.email.trim(), form.password);
      // Al autenticar, ProtectedRoute muestra la app (redirección al catálogo)
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
      setEnviando(false);
    }
  };

  return (
    <AuthLayout
      titulo="Inicia sesión"
      subtitulo="Accede a tu repertorio y al catálogo de partituras."
      pie={
        <>
          ¿No tienes cuenta?{' '}
          <button type="button" className="auth-link" onClick={onIrARegistro}>Regístrate</button>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="auth-alert" role="alert">{error}</div>}

        <div className="form-field-group">
          <label htmlFor="login-email" className="form-label">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className="form-input"
            value={form.email}
            onChange={cambiar('email')}
            required
          />
        </div>

        <div className="form-field-group">
          <label htmlFor="login-password" className="form-label">Contraseña</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="form-input"
            value={form.password}
            onChange={cambiar('password')}
            required
          />
        </div>

        <button type="submit" className="btn-primary auth-submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthLayout>
  );
}
