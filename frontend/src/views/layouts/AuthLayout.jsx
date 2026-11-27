import { useEffect } from 'react';

// Marco común de las pantallas de acceso (fuera del AppProvider, por eso aplica el tema guardado aquí)
export default function AuthLayout({ titulo, subtitulo, children, pie }) {
  useEffect(() => {
    let tema = 'light';
    try {
      tema = localStorage.getItem('scorepulse_theme')
        || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch { /* almacenamiento no disponible */ }
    document.documentElement.setAttribute('data-theme', tema);
  }, []);

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-titulo">
        <div className="auth-brand">
          <div className="brand-logo-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <span className="brand-name">ScorePulse</span>
        </div>
        <h1 id="auth-titulo" className="auth-title">{titulo}</h1>
        {subtitulo && <p className="auth-subtitle">{subtitulo}</p>}
        {children}
        {pie && <p className="auth-footer">{pie}</p>}
      </section>
    </main>
  );
}
