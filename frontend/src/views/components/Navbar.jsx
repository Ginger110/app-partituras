import { useState } from 'react';
import { useApp } from '../../context/useApp';
import { getDifficultyTier } from '../../utils/difficultyUtils';

export default function Navbar() {
  const { currentView, setCurrentView, user, repertorio, theme, toggleTheme } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tier = getDifficultyTier(user.nivel_tecnico);

  const navItems = [
    { id: 'catalogo', label: 'Catálogo', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'perfil', label: 'Mi Perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', badge: repertorio.length },
    { id: 'subir', label: 'Subir Partitura', icon: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="header-global">
      <div className="header-container">
        {/* Izquierda: Logo de la plataforma */}
        <div className="header-brand" onClick={() => handleNavClick('catalogo')} role="button" tabIndex={0}>
          <div className="brand-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className="brand-titles">
            <span className="brand-name">ScorePulse</span>
            <span className="brand-tagline">Catalogación & Dificultad Dinámica</span>
          </div>
        </div>

        {/* Centro: Enlaces rápidos de navegación (Desktop) */}
        <nav className="header-nav-desktop" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon}></path>
                </svg>
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="nav-counter" title={`${item.badge} obras en tu repertorio`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Derecha: Selector de Modo Oscuro + Avatar de usuario + Indicador de Nivel */}
        <div className="header-user-area">
          {/* Botón de alternancia de Modo Oscuro / Claro */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Cambiar a modo claro (☀️)' : 'Cambiar a modo oscuro (🌙)'}
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          <div
            className="user-level-pill"
            style={{
              backgroundColor: tier.badgeBg,
              color: tier.badgeText,
              borderColor: tier.badgeBorder
            }}
            title={`Tu Nivel Técnico Actual es ${user.nivel_tecnico.toFixed(1)} (${tier.label}). Se recalcula dinámicamente según tus obras aprendidas.`}
            onClick={() => handleNavClick('perfil')}
            role="button"
            tabIndex={0}
          >
            <span className="level-dot" style={{ backgroundColor: tier.dotColor }}></span>
            <span className="level-label">Nivel Técnico</span>
            <span className="level-value font-mono">{user.nivel_tecnico.toFixed(1)}</span>
            <span className="level-tier-name">{tier.label}</span>
          </div>

          <div
            className="user-avatar-wrapper"
            onClick={() => handleNavClick('perfil')}
            role="button"
            tabIndex={0}
            title={`${user.nombre} (${user.instrumento_principal})`}
          >
            <img
              src={user.avatar_url}
              alt={user.nombre}
              className="user-avatar-img"
            />
            <span className="avatar-status-badge" style={{ backgroundColor: tier.dotColor }} />
          </div>

          {/* Botón menú hamburguesa (Móvil) */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Alternar menú de navegación"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú desplegable para Móvil (<= 768px) */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <div className="mobile-user-summary">
            <img src={user.avatar_url} alt="" className="mobile-user-avatar" />
            <div>
              <div className="mobile-user-name">{user.nombre}</div>
              <div className="mobile-user-meta">{user.instrumento_principal} • Nivel {user.nivel_tecnico.toFixed(1)} ({tier.label})</div>
            </div>
          </div>
          <nav className="mobile-nav-links">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon}></path>
                  </svg>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="mobile-nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mobile-theme-row">
            <span className="mobile-theme-label">Tema de interfaz:</span>
            <button
              type="button"
              className="mobile-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
