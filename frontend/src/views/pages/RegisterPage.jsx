import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import AuthLayout from '../layouts/AuthLayout';

const esEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function validar({ nombre, email, password, confirmar }) {
  const errores = {};
  if (!nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
  if (!esEmail(email)) errores.email = 'Ingresa un correo válido.';
  if (password.length < 8) errores.password = 'Mínimo 8 caracteres.';
  if (confirmar !== password) errores.confirmar = 'Las contraseñas no coinciden.';
  return errores;
}

export default function RegisterPage({ onIrALogin }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
    setErrorServidor('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const encontrados = validar(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      await register(form.nombre.trim(), form.email.trim(), form.password);
      // Al registrarse queda autenticado y ProtectedRoute muestra la app
    } catch (err) {
      setErrorServidor(err.message || 'No se pudo crear la cuenta.');
      setEnviando(false);
    }
  };

  const campo = (id, etiqueta, tipo, autoComplete) => (
    <div className="form-field-group">
      <label htmlFor={`reg-${id}`} className="form-label">{etiqueta}</label>
      <input
        id={`reg-${id}`}
        type={tipo}
        autoComplete={autoComplete}
        className={`form-input ${errores[id] ? 'form-input-error' : ''}`}
        value={form[id]}
        onChange={cambiar(id)}
        aria-invalid={!!errores[id]}
        aria-describedby={errores[id] ? `reg-${id}-error` : undefined}
      />
      {errores[id] && <span id={`reg-${id}-error`} className="field-error-msg">{errores[id]}</span>}
    </div>
  );

  return (
    <AuthLayout
      titulo="Crea tu cuenta"
      subtitulo="Registra tu repertorio y sigue tu nivel técnico."
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <button type="button" className="auth-link" onClick={onIrALogin}>Inicia sesión</button>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {errorServidor && <div className="auth-alert" role="alert">{errorServidor}</div>}
        {campo('nombre', 'Nombre', 'text', 'name')}
        {campo('email', 'Correo electrónico', 'email', 'email')}
        {campo('password', 'Contraseña', 'password', 'new-password')}
        {campo('confirmar', 'Confirmar contraseña', 'password', 'new-password')}
        <button type="submit" className="btn-primary auth-submit" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Registrarme'}
        </button>
      </form>
    </AuthLayout>
  );
}
