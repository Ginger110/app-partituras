import { useState } from 'react';
import { useApp } from '../../context/useApp';
import BadgeDificultad from '../components/BadgeDificultad';
import EmptyState from '../components/EmptyState';
import CardPartitura from '../components/CardPartitura';
import {
  getDifficultyTier,
  validatePasswordStrength
} from '../../utils/difficultyUtils';

export default function PerfilPage() {
  const {
    user,
    repertorio,
    favoritos,
    profileTab,
    setProfileTab,
    removeFromRepertorio,
    setRatingModalPartitura,
    setAddRepertoryModalOpen,
    setCurrentView,
    updateUserProfile,
    addToast,
    uiState
  } = useApp();

  // Estados locales para el formulario de Editar Perfil
  const [formData, setFormData] = useState({
    nombre: user.nombre,
    email: user.email,
    instrumento_principal: user.instrumento_principal,
    link_portafolio: user.link_portafolio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tier = getDifficultyTier(user.nivel_tecnico);
  const baseTier = getDifficultyTier(user.nivel_base);
  const deltaNivel = user.nivel_tecnico - user.nivel_base;

  // Manejo de tabs
  const handleTabChange = (tabId) => {
    setProfileTab(tabId);
  };

  // Manejo de cambios en formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validación y guardado de perfil (RNF de seguridad para contraseñas)
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre completo es obligatorio.';
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Debes ingresar un correo electrónico válido.';
    }

    // Validación de cambio de contraseña si se ingresó algo
    if (formData.newPassword) {
      const strength = validatePasswordStrength(formData.newPassword);
      if (!strength.isValid) {
        errors.newPassword = 'La contraseña no cumple las políticas mínimas de seguridad (RNF-02).';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden.';
      }
      if (!formData.currentPassword) {
        errors.currentPassword = 'Debes ingresar tu contraseña actual para confirmar cambios sensibles.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Por favor corrige los errores visualizados en rojo.', 'error');
      return;
    }

    updateUserProfile({
      nombre: formData.nombre,
      email: formData.email,
      instrumento_principal: formData.instrumento_principal,
      link_portafolio: formData.link_portafolio
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Comportamiento del UI State Switcher: si está en 'error', forzar errores visibles
  const displayedErrors = uiState === 'error' ? {
    nombre: 'Campo obligatorio: el nombre no puede estar vacío.',
    email: 'Formato de correo inválido (ej: usuario@dominio.com).',
    newPassword: 'Contraseña insegura: requiere min. 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.',
    confirmPassword: 'La confirmación no coincide con la nueva contraseña.'
  } : formErrors;

  // Password checks interactivos
  const passwordChecks = validatePasswordStrength(formData.newPassword);

  // Comportamiento de lista vacía en repertorio
  const repertorioVacio = uiState === 'empty' || repertorio.length === 0;

  return (
    <div className="perfil-view" aria-label="Perfil de Usuario y Repertorio">
      {/* 1. CABECERA DEL PERFIL: HERO DE NIVEL TÉCNICO Y PROGRESIÓN */}
      <div className="profile-hero-card">
        <div className="profile-hero-main">
          {/* Avatar y Datos Personales */}
          <div className="profile-identity">
            <div className="profile-avatar-large-wrap">
              <img
                src={user.avatar_url}
                alt={user.nombre}
                className="profile-avatar-large"
              />
              <span className="profile-tier-ring" style={{ borderColor: tier.dotColor }} />
            </div>

            <div className="profile-identity-info">
              <div className="profile-tags-row">
                <span className="profile-instrument-badge font-semibold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6z"></path>
                  </svg>
                  {user.instrumento_principal}
                </span>
                <span className="profile-role-badge">Intérprete Certificado</span>
              </div>
              <h1 className="profile-name">{user.nombre}</h1>
              <p className="profile-bio">{user.bio}</p>
            </div>
          </div>

          {/* INDICADOR VISUAL PROMINENTE DEL NIVEL TÉCNICO ACTUAL */}
          <div className="profile-level-spotlight" style={{ borderColor: tier.badgeBorder }}>
            <span className="spotlight-title">NIVEL TÉCNICO ACTUAL</span>
            <div className="spotlight-score-row">
              <span className="spotlight-score font-mono font-bold" style={{ color: tier.badgeText }}>
                {user.nivel_tecnico.toFixed(1)}
              </span>
              <span className="spotlight-max font-mono">/ 10.0</span>
            </div>

            <div className="spotlight-tier-pill" style={{ backgroundColor: tier.badgeBg, color: tier.badgeText }}>
              <span className="spotlight-dot" style={{ backgroundColor: tier.dotColor }} />
              <span>Categoría: <strong>{tier.label}</strong></span>
            </div>

            {/* Simulación visual de recálculo dinámico */}
            <div className="level-progression-box">
              <div className="progression-metric-row font-mono text-xs">
                <span>Nivel Base: {user.nivel_base.toFixed(1)}</span>
                <span className="progression-delta" style={{ color: deltaNivel >= 0 ? '#059669' : '#DC2626' }}>
                  {deltaNivel >= 0 ? `+${deltaNivel.toFixed(1)} acumulado` : `${deltaNivel.toFixed(1)}`}
                </span>
              </div>
              <div className="progression-bar-bg">
                <div
                  className="progression-bar-fill"
                  style={{
                    width: `${Math.min(100, (user.nivel_tecnico / 10) * 100)}%`,
                    backgroundColor: tier.dotColor
                  }}
                />
              </div>
              <span className="progression-footnote">
                Recalculado con {repertorio.length} obras dominadas y ratings comunitarios.
              </span>
            </div>
          </div>
        </div>

        {/* Resumen de Métricas Rápidas */}
        <div className="profile-stats-bar">
          <div className="stat-pill-item">
            <span className="stat-number font-mono">{repertorio.length}</span>
            <span className="stat-label">Obras en Repertorio</span>
          </div>
          <div className="stat-pill-item">
            <span className="stat-number font-mono">{favoritos.length}</span>
            <span className="stat-label">Guardadas en Favoritos</span>
          </div>
          <div className="stat-pill-item">
            <span className="stat-number font-mono">
              {repertorio.filter(r => r.calificado).length}
            </span>
            <span className="stat-label">Calificaciones Aportadas</span>
          </div>
          <div className="stat-pill-item">
            <span className="stat-number font-mono">{baseTier.label}</span>
            <span className="stat-label">Punto de Partida</span>
          </div>
        </div>
      </div>

      {/* 2. NAVEGACIÓN POR PESTAÑAS (TABS) */}
      <div className="profile-tabs-wrapper">
        <div className="profile-tabs-nav" role="tablist" aria-label="Secciones del perfil">
          <button
            type="button"
            role="tab"
            aria-selected={profileTab === 'repertorio'}
            className={`profile-tab-btn ${profileTab === 'repertorio' ? 'profile-tab-active' : ''}`}
            onClick={() => handleTabChange('repertorio')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6z"></path>
            </svg>
            <span>Mi Repertorio</span>
            <span className="tab-counter-badge">{repertorio.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={profileTab === 'favoritos'}
            className={`profile-tab-btn ${profileTab === 'favoritos' ? 'profile-tab-active' : ''}`}
            onClick={() => handleTabChange('favoritos')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
            </svg>
            <span>Favoritos / Guardados</span>
            <span className="tab-counter-badge">{favoritos.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={profileTab === 'editar'}
            className={`profile-tab-btn ${profileTab === 'editar' ? 'profile-tab-active' : ''}`}
            onClick={() => handleTabChange('editar')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Editar Perfil & Seguridad</span>
          </button>
        </div>

        {/* 3. BOTÓN FLOTANTE / DESTACADO "AÑADIR AL REPERTORIO" */}
        {profileTab === 'repertorio' && (
          <div className="tab-action-bar">
            <button
              type="button"
              className="btn-primary btn-add-repertory"
              onClick={() => setAddRepertoryModalOpen(true)}
              title="Abrir buscador rápido para añadir pieza aprendida"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Añadir al Repertorio</span>
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="profile-tab-content">
        {/* PESTAÑA 1: MI REPERTORIO */}
        {profileTab === 'repertorio' && (
          <div className="tab-panel" role="tabpanel" aria-label="Mi Repertorio">
            {repertorioVacio ? (
              <EmptyState
                title="Tu repertorio aún no tiene obras registradas"
                description="Al marcar partituras como 'aprendidas / tocadas', el algoritmo calculará tu nivel técnico dinámico instrumental."
                actionText="Añadir mi primera partitura al repertorio"
                onAction={() => setAddRepertoryModalOpen(true)}
                iconType="music"
              />
            ) : (
              <div className="repertory-table-wrapper">
                <table className="repertory-table">
                  <thead>
                    <tr>
                      <th scope="col">Obra / Partitura</th>
                      <th scope="col">Instrumento</th>
                      <th scope="col">Dificultad de la Obra</th>
                      <th scope="col">Estado de Impacto</th>
                      <th scope="col">Tu Calificación (CU02)</th>
                      <th scope="col" className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repertorio.map((item) => (
                      <tr key={item.id} className="repertory-row">
                        <td>
                          <div className="repertory-piece-info">
                            <span className="repertory-piece-title">{item.nombre}</span>
                            <span className="repertory-piece-meta">{item.autor_obra} • {item.estilo}</span>
                          </div>
                        </td>
                        <td>
                          <span className="table-instrument-tag">{item.instrumentacion}</span>
                        </td>
                        <td>
                          <BadgeDificultad score={item.dificultadCalculada} size="sm" />
                        </td>
                        <td>
                          <span className="impact-pill impact-positive">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Dominada • Aporta a tu Nivel
                          </span>
                        </td>
                        <td>
                          {item.calificado ? (
                            <span className="calificado-status-tag" title="Ya asignaste tu rating relativo">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" strokeWidth="1">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                              {item.mi_calificacion === 1
                                ? 'Más exigente (+1)'
                                : item.mi_calificacion === -1
                                ? 'Menos exigente (-1)'
                                : 'Igual a tu nivel (0)'}
                            </span>
                          ) : (
                            <span className="pending-rating-tag">
                              Pendiente de calificar
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="btn-secondary btn-xs"
                              onClick={() => setRatingModalPartitura(item)}
                              title="Calificar la dificultad relativa de esta obra (CU02)"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                              Calificar Dificultad
                            </button>
                            <button
                              type="button"
                              className="btn-ghost-danger btn-xs"
                              onClick={() => removeFromRepertorio(item.id)}
                              title="Retirar de mis obras aprendidas"
                              aria-label={`Eliminar ${item.nombre} de mi repertorio`}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: FAVORITOS / GUARDADOS */}
        {profileTab === 'favoritos' && (
          <div className="tab-panel" role="tabpanel" aria-label="Favoritos">
            {favoritos.length === 0 ? (
              <EmptyState
                title="Aún no tienes partituras guardadas"
                description="Explora el catálogo y presiona el ícono del corazón para guardar piezas que quieras aprender a futuro."
                actionText="Ir al Catálogo de Partituras"
                onAction={() => setCurrentView('catalogo')}
                iconType="heart"
              />
            ) : (
              <div className="scores-grid">
                {favoritos.map((partitura) => (
                  <CardPartitura key={partitura.id} partitura={partitura} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: EDITAR PERFIL & SEGURIDAD */}
        {profileTab === 'editar' && (
          <div className="tab-panel" role="tabpanel" aria-label="Editar Perfil">
            <div className="edit-profile-card">
              <div className="form-section-header">
                <h3 className="section-title">Información de Cuenta e Intérprete</h3>
                <p className="section-desc">Mantén actualizados tus datos de músico y enlaces de portafolio.</p>
              </div>

              {saveSuccess && (
                <div className="alert-success-banner" role="alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>¡Tus cambios han sido guardados con éxito!</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} noValidate>
                <div className="form-grid-2">
                  {/* Nombre */}
                  <div className="form-field-group">
                    <label htmlFor="user-nombre" className="form-label">
                      Nombre Completo <span className="req-star">*</span>
                    </label>
                    <input
                      id="user-nombre"
                      type="text"
                      className={`form-input ${displayedErrors.nombre ? 'form-input-error' : ''}`}
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      required
                    />
                    {displayedErrors.nombre && (
                      <span className="field-error-msg">{displayedErrors.nombre}</span>
                    )}
                  </div>

                  {/* Correo Electrónico */}
                  <div className="form-field-group">
                    <label htmlFor="user-email" className="form-label">
                      Correo Electrónico <span className="req-star">*</span>
                    </label>
                    <input
                      id="user-email"
                      type="email"
                      className={`form-input ${displayedErrors.email ? 'form-input-error' : ''}`}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                    {displayedErrors.email && (
                      <span className="field-error-msg">{displayedErrors.email}</span>
                    )}
                  </div>

                  {/* Instrumento Principal */}
                  <div className="form-field-group">
                    <label htmlFor="user-instrumento" className="form-label">
                      Instrumento Principal
                    </label>
                    <select
                      id="user-instrumento"
                      className="form-select"
                      value={formData.instrumento_principal}
                      onChange={(e) => handleInputChange('instrumento_principal', e.target.value)}
                    >
                      <option value="Piano">Piano</option>
                      <option value="Violín">Violín</option>
                      <option value="Guitarra">Guitarra clásica</option>
                      <option value="Violonchelo">Violonchelo</option>
                      <option value="Flauta">Flauta traversa</option>
                      <option value="Clarinete">Clarinete</option>
                    </select>
                  </div>

                  {/* Portafolio */}
                  <div className="form-field-group">
                    <label htmlFor="user-portafolio" className="form-label">
                      Enlace de Portafolio / Grabaciones
                    </label>
                    <input
                      id="user-portafolio"
                      type="url"
                      className="form-input"
                      placeholder="https://soundcloud.com/..."
                      value={formData.link_portafolio}
                      onChange={(e) => handleInputChange('link_portafolio', e.target.value)}
                    />
                  </div>
                </div>

                {/* SECCIÓN SEGURIDAD / CAMBIAR CONTRASEÑA (RNF) */}
                <div className="security-divider">
                  <h4 className="security-section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                    Seguridad y Cambio de Contraseña (Requisitos RNF)
                  </h4>
                  <p className="security-section-desc">
                    Deja estos campos en blanco si no deseas cambiar tu contraseña.
                  </p>
                </div>

                <div className="form-grid-3">
                  <div className="form-field-group">
                    <label htmlFor="curr-pass" className="form-label">Contraseña Actual</label>
                    <input
                      id="curr-pass"
                      type="password"
                      className={`form-input ${displayedErrors.currentPassword ? 'form-input-error' : ''}`}
                      placeholder="••••••••"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    />
                    {displayedErrors.currentPassword && (
                      <span className="field-error-msg">{displayedErrors.currentPassword}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="new-pass" className="form-label">Nueva Contraseña</label>
                    <input
                      id="new-pass"
                      type="password"
                      className={`form-input ${displayedErrors.newPassword ? 'form-input-error' : ''}`}
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    />
                    {displayedErrors.newPassword && (
                      <span className="field-error-msg">{displayedErrors.newPassword}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="conf-pass" className="form-label">Confirmar Nueva Contraseña</label>
                    <input
                      id="conf-pass"
                      type="password"
                      className={`form-input ${displayedErrors.confirmPassword ? 'form-input-error' : ''}`}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                    {displayedErrors.confirmPassword && (
                      <span className="field-error-msg">{displayedErrors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                {/* Checklist de requisitos de seguridad en vivo */}
                {formData.newPassword && (
                  <div className="password-checklist-box">
                    <span className="checklist-title">Requisitos mínimos de seguridad (RNF-02):</span>
                    <ul className="checklist-items">
                      {Object.entries(passwordChecks.checks).map(([key, item]) => (
                        <li key={key} className={item.ok ? 'check-ok' : 'check-fail'}>
                          <span className="check-bullet">{item.ok ? '✓' : '✗'}</span>
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="form-actions-row">
                  <button type="submit" className="btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Guardar Cambios de Perfil
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
