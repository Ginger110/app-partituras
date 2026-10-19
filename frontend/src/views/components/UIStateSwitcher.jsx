import { useState } from 'react';
import { useApp } from '../../context/useApp';

export default function UIStateSwitcher() {
  const { uiState, setUiState } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const states = [
    {
      id: 'normal',
      label: 'Normal',
      badge: 'Datos reales',
      color: '#10B981',
      desc: 'Catálogo con obras variadas, repertorio activo y cálculos consolidados.'
    },
    {
      id: 'empty',
      label: 'Estado Vacío (Empty)',
      badge: 'Sin datos / 0 resultados',
      color: '#64748B',
      desc: 'Muestra ilustraciones, mensajes amigables y botones CTA en búsquedas y repertorio.'
    },
    {
      id: 'error',
      label: 'Error en Formularios',
      badge: 'Validaciones en rojo',
      color: '#EF4444',
      desc: 'Activa alertas visuales de campos requeridos, URLs inválidas y contraseñas débiles.'
    },
    {
      id: 'feedback',
      label: 'Confirmación / Feedback',
      badge: 'Toasts & Recálculo',
      color: '#3B82F6',
      desc: 'Dispara alertas de éxito inmediatas mostrando recálculo de nivel de 4.2 a 4.5.'
    }
  ];

  return (
    <aside className="ui-state-switcher-container" aria-label="Selector de demostración de estados UI">
      {collapsed ? (
        <button
          type="button"
          className="switcher-toggle-pill"
          onClick={() => setCollapsed(false)}
          title="Abrir panel de estados para evaluación"
        >
          <span className="switcher-pulse-dot" />
          <span className="font-semibold text-xs">Evaluador UI/UX</span>
          <span className="switcher-state-tag font-mono">{uiState.toUpperCase()}</span>
        </button>
      ) : (
        <div className="switcher-panel">
          <div className="switcher-panel-header">
            <div className="switcher-header-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
              </svg>
              <span>Demostración de Estados UI</span>
            </div>
            <button
              type="button"
              className="switcher-close-btn"
              onClick={() => setCollapsed(true)}
              aria-label="Minimizar panel"
            >
              ✕
            </button>
          </div>

          <p className="switcher-hint">
            Alterna en vivo los estados exigidos en la rúbrica para capturar pantallas del informe:
          </p>

          <div className="switcher-buttons-list">
            {states.map((st) => {
              const isActive = uiState === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  className={`switcher-btn ${isActive ? 'switcher-btn-active' : ''}`}
                  onClick={() => setUiState(st.id)}
                >
                  <div className="switcher-btn-top">
                    <span
                      className="switcher-color-indicator"
                      style={{ backgroundColor: st.color }}
                    />
                    <strong className="switcher-btn-title">{st.label}</strong>
                    <span className="switcher-mini-badge">{st.badge}</span>
                  </div>
                  <span className="switcher-btn-desc">{st.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
