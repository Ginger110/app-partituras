import { useApp } from '../../context/useApp';
import BadgeDificultad from './BadgeDificultad';
import { getDifficultyTier } from '../../utils/difficultyUtils';

export default function DetailModal() {
  const {
    detailModalPartitura,
    setDetailModalPartitura,
    repertorio,
    favoritos,
    addToRepertorio,
    toggleFavorito,
    setRatingModalPartitura
  } = useApp();

  if (!detailModalPartitura) return null;

  const partitura = detailModalPartitura;
  const isEnRepertorio = repertorio.some(r => r.id === partitura.id);
  const isFavorito = favoritos.some(f => f.id === partitura.id);
  const tier = getDifficultyTier(partitura.dificultadCalculada);

  const handleOpenRating = () => {
    const current = partitura;
    setDetailModalPartitura(null);
    setRatingModalPartitura(current);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => setDetailModalPartitura(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header del Modal */}
        <div className="modal-header">
          <div className="modal-header-icon detail-icon-bg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div className="modal-header-text">
            <span className="modal-badge-sup">{partitura.estilo} • {partitura.instrumentacion}</span>
            <h2 id="detail-modal-title" className="modal-title">{partitura.nombre}</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setDetailModalPartitura(null)}
            aria-label="Cerrar modal de detalles"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="modal-body-scroll">
          {/* Fila de métricas clave */}
          <div className="detail-hero-box">
            <div className="detail-hero-left">
              <span className="detail-hero-label">Dificultad Dinámica Calculada</span>
              <div className="detail-hero-badge-wrap">
                <BadgeDificultad score={partitura.dificultadCalculada} size="lg" />
              </div>
              <p className="detail-hero-sub">
                {tier.description}
              </p>
            </div>

            <div className="detail-hero-right">
              <div className="hero-stat-card">
                <span className="hero-stat-num font-mono">{partitura.totalRatings || 0}</span>
                <span className="hero-stat-txt">Calificaciones de la comunidad</span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-num font-mono">{partitura.dificultadEstimada.toFixed(1)}</span>
                <span className="hero-stat-txt">Dificultad inicial estimada</span>
              </div>
            </div>
          </div>

          {/* Ficha técnica estructurada */}
          <div className="detail-grid-specs">
            <div className="spec-item">
              <span className="spec-label">Obra Original</span>
              <span className="spec-value">{partitura.obra_nombre}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Compositor</span>
              <span className="spec-value">{partitura.autor_obra}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Instrumentación</span>
              <span className="spec-value">{partitura.instrumentacion}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Época / Estilo</span>
              <span className="spec-value">{partitura.estilo}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Tipo de Arreglo</span>
              <span className="spec-value">{partitura.arreglo || 'Original'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Arreglista / Transcriptor</span>
              <span className="spec-value">{partitura.arreglista || partitura.transcriptor || 'No especificado'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Editorial / Fuente</span>
              <span className="spec-value">{partitura.editor || 'Comunidad'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Precio de Licencia</span>
              <span className="spec-value font-semibold">
                {partitura.precio === 0 ? 'Gratuito (Dominio Público)' : `$${partitura.precio.toLocaleString('es-CL')} CLP`}
              </span>
            </div>
          </div>

          {/* Información interpretativa */}
          {partitura.info && (
            <div className="detail-notes-card">
              <div className="notes-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Notas Técnicas e Interpretativas
              </div>
              <p className="notes-card-body">{partitura.info}</p>
            </div>
          )}

          {/* Enlace oficial de la partitura */}
          <div className="detail-url-section">
            <span className="url-label">Fuente oficial / Enlace de descarga (PDF):</span>
            <a
              href={partitura.url}
              target="_blank"
              rel="noopener noreferrer"
              className="partitura-external-link"
              title="Abrir enlace de la partitura en nueva pestaña"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span className="truncate">{partitura.url}</span>
            </a>
          </div>
        </div>

        {/* Footer de Acciones del Modal */}
        <div className="modal-actions-footer">
          <button
            type="button"
            className={`btn-ghost ${isFavorito ? 'text-danger' : ''}`}
            onClick={() => toggleFavorito(partitura.id)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorito ? '#EF4444' : 'none'} stroke={isFavorito ? '#EF4444' : 'currentColor'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
            </svg>
            {isFavorito ? 'Guardado en Favoritos' : 'Guardar en Favoritos'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleOpenRating}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Calificar Dificultad (CU02)
          </button>

          {isEnRepertorio ? (
            <span className="repertory-status-tag">
              ✓ Ya está en tu Repertorio
            </span>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                addToRepertorio(partitura.id);
                setDetailModalPartitura(null);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Añadir a mi repertorio (CU01)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
