import { useState } from 'react';
import { useApp } from '../../context/useApp';
import BadgeDificultad from './BadgeDificultad';
import { getDifficultyTier, calcularDificultadDinamica } from '../../utils/difficultyUtils';

export default function RatingModal() {
  const {
    ratingModalPartitura,
    setRatingModalPartitura,
    user,
    submitRating
  } = useApp();

  const [selectedValue, setSelectedValue] = useState(0); // -1, 0, 1
  const [submitting, setSubmitting] = useState(false);

  if (!ratingModalPartitura) return null;

  const userTier = getDifficultyTier(user.nivel_tecnico);
  const partitura = ratingModalPartitura;

  // Simulación en tiempo real de cómo impactaría esta calificación en la obra
  const simulatedNewDifficulty = calcularDificultadDinamica(
    partitura.dificultadEstimada,
    [...(partitura.ratings || []), { id_usuario: user.id, nivel_usuario: user.nivel_tecnico, valor: selectedValue }]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      submitRating(partitura.id, selectedValue);
      setSubmitting(false);
    }, 350);
  };

  const ratingOptions = [
    {
      value: -1,
      title: 'Menos exigente que mi nivel',
      subtitle: `Sentí la obra accesible en comparación a mi nivel actual (${user.nivel_tecnico.toFixed(1)}).`,
      deltaDescription: 'Ayuda a normalizar la obra a un nivel más asequible.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      ),
      activeBorder: '#10B981',
      activeBg: '#ECFDF5'
    },
    {
      value: 0,
      title: 'Igual a mi nivel',
      subtitle: `La dificultad de ejecución coincide exactamente con mi nivel técnico (${user.nivel_tecnico.toFixed(1)}).`,
      deltaDescription: 'Afianza y calibra la dificultad actual del sistema.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      activeBorder: '#F59E0B',
      activeBg: '#FFFBEB'
    },
    {
      value: 1,
      title: 'Más exigente que mi nivel',
      subtitle: `Contiene pasajes técnicos complejos que superan mi nivel actual (${user.nivel_tecnico.toFixed(1)}).`,
      deltaDescription: 'Ajusta el puntaje de la obra hacia arriba en el catálogo.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      ),
      activeBorder: '#8B5CF6',
      activeBg: '#F5F3FF'
    }
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={() => setRatingModalPartitura(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
    >
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header del Modal */}
        <div className="modal-header">
          <div className="modal-header-icon rating-icon-bg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="modal-header-text">
            <h2 id="rating-modal-title" className="modal-title">Calificar Dificultad Técnica (CU02)</h2>
            <p className="modal-subtitle">Calibración Bayesiana colaborativa según tu nivel instrumental</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setRatingModalPartitura(null)}
            aria-label="Cerrar modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Comparativa Visual de Referencia */}
        <div className="rating-benchmark-box">
          <div className="benchmark-card">
            <span className="benchmark-label">Obra a calificar</span>
            <div className="benchmark-title">{partitura.nombre}</div>
            <div className="benchmark-meta">{partitura.autor_obra} • {partitura.instrumentacion}</div>
            <div className="benchmark-metric">
              <span className="metric-caption">Dificultad actual del sistema:</span>
              <BadgeDificultad score={partitura.dificultadCalculada} size="md" />
            </div>
          </div>

          <div className="benchmark-vs font-mono">VS</div>

          <div className="benchmark-card benchmark-user">
            <span className="benchmark-label">Tu Nivel de Referencia</span>
            <div className="benchmark-title">{user.nombre}</div>
            <div className="benchmark-meta">{user.instrumento_principal}</div>
            <div className="benchmark-metric">
              <span className="metric-caption">Tu Nivel Técnico Actual:</span>
              <span
                className="user-reference-badge font-mono font-bold"
                style={{ backgroundColor: userTier.badgeBg, color: userTier.badgeText, borderColor: userTier.badgeBorder }}
              >
                {user.nivel_tecnico.toFixed(1)} • {userTier.label}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario de Calificación Relativa */}
        <form onSubmit={handleSubmit} className="rating-form">
          <label className="rating-question-label">
            ¿Cómo sentiste la exigencia técnica de esta obra al tocarla respecto a tu nivel actual ({user.nivel_tecnico.toFixed(1)})?
          </label>

          <div className="rating-options-grid">
            {ratingOptions.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <div
                  key={opt.value}
                  className={`rating-option-card ${isSelected ? 'rating-option-selected' : ''}`}
                  onClick={() => setSelectedValue(opt.value)}
                  style={isSelected ? { borderColor: opt.activeBorder, backgroundColor: opt.activeBg } : {}}
                  role="button"
                  tabIndex={0}
                >
                  <div className="option-card-top">
                    <div className="option-icon-box">{opt.icon}</div>
                    <input
                      type="radio"
                      name="ratingValue"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => setSelectedValue(opt.value)}
                      className="option-radio-input"
                      aria-label={opt.title}
                    />
                  </div>
                  <h4 className="option-title">{opt.title}</h4>
                  <p className="option-subtitle">{opt.subtitle}</p>
                  <span className="option-delta-badge">{opt.deltaDescription}</span>
                </div>
              );
            })}
          </div>

          {/* Previsualización del Cálculo Dinámico */}
          <div className="rating-preview-box">
            <div className="preview-info-row">
              <span className="preview-label">Impacto proyectado en el sistema:</span>
              <div className="preview-values">
                <span className="font-mono text-muted">{partitura.dificultadCalculada.toFixed(1)}</span>
                <span className="preview-arrow">➔</span>
                <span className="font-mono font-bold preview-new-score">{simulatedNewDifficulty.toFixed(1)}</span>
                <span className="preview-subtext font-mono">
                  ({simulatedNewDifficulty > partitura.dificultadCalculada ? '+' : ''}
                  {(simulatedNewDifficulty - partitura.dificultadCalculada).toFixed(1)} pts)
                </span>
              </div>
            </div>
            <p className="preview-explanation">
              Tu calificación se ponderará con tu nivel instrumental ({user.nivel_tecnico.toFixed(1)}) usando el algoritmo Bayesiano del servidor.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="modal-actions-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRatingModalPartitura(null)}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Procesando cálculo...' : 'Confirmar Calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
