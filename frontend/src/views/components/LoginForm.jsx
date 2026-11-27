import { useState } from 'react';
import { useAuth } from '../../context/useAuth';

export default function LoginForm({ onIrARegistro }) {
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
      // Al autenticar se cierra el modal y se retoma la acción pendiente
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
      setEnviando(false);
    }
  };

  return (
    <>
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
            autoFocus
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
      <p className="auth-footer">
        ¿No tienes cuenta?{' '}
        <button type="button" className="auth-link" onClick={onIrARegistro}>Regístrate</button>
      </p>
    </>
  );
}
