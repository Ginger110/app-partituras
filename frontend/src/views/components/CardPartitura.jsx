import { useApp } from '../../context/useApp';
import BadgeDificultad from './BadgeDificultad';

export default function CardPartitura({ partitura }) {
  const {
    repertorio,
    favoritos,
    addToRepertorio,
    toggleFavorito,
    setDetailModalPartitura,
    setRatingModalPartitura
  } = useApp();

  const isEnRepertorio = repertorio.some(r => r.id === partitura.id);
  const isFavorito = favoritos.some(f => f.id === partitura.id);

  return (
    <article className="score-card" aria-labelledby={`score-title-${partitura.id}`}>
      {/* Cabecera de la tarjeta: Categoría / Instrumento y Botón Favorito */}
      <div className="score-card-header">
        <div className="score-card-meta">
          <span className="meta-pill instrument-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z"></path>
            </svg>
            {partitura.instrumentacion}
          </span>
          <span className="meta-pill style-pill">{partitura.estilo}</span>
        </div>

        <button
          type="button"
          className={`favorite-btn ${isFavorito ? 'favorite-btn-active' : ''}`}
          onClick={() => toggleFavorito(partitura.id)}
          title={isFavorito ? 'Quitar de guardados' : 'Guardar en Favoritos'}
          aria-label={isFavorito ? 'Quitar de guardados' : 'Guardar en Favoritos'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorito ? '#EF4444' : 'none'} stroke={isFavorito ? '#EF4444' : 'currentColor'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
          </svg>
        </button>
      </div>

      {/* Cuerpo principal */}
      <div className="score-card-body">
        <h3 id={`score-title-${partitura.id}`} className="score-title" title={partitura.nombre}>
          {partitura.nombre}
        </h3>
        
        <p className="score-composer">
          <span className="composer-label">Compositor:</span>
          <strong>{partitura.autor_obra}</strong>
        </p>

        <p className="score-editor-text">
          <span>Edición / Transcripción:</span> {partitura.editor || partitura.transcriptor || 'Urtext'}
        </p>

        {/* Zona de Métricas Clave: Nivel de Dificultad Dinámico y Ratings */}
        <div className="score-metrics-row">
          <div className="metric-col">
            <span className="metric-label">Dificultad Dinámica</span>
            <BadgeDificultad score={partitura.dificultadCalculada} size="md" />
          </div>

          <div className="metric-col text-right">
            <span className="metric-label">Calificaciones</span>
            <div className="ratings-pill" title={`${partitura.totalRatings || 0} usuarios han calificado esta obra`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span className="ratings-count font-mono">{partitura.totalRatings || 0}</span>
              <span className="ratings-subtext">votos</span>
            </div>
          </div>
        </div>

        {/* Precio o Acceso Libre */}
        <div className="score-price-row">
          {partitura.precio === 0 ? (
            <span className="price-tag free-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Acceso Abierto (Gratis)
            </span>
          ) : (
            <span className="price-tag paid-tag">
              ${partitura.precio.toLocaleString('es-CL')} CLP
            </span>
          )}
        </div>
      </div>

      {/* Footer de Acciones */}
      <div className="score-card-footer">
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => setDetailModalPartitura(partitura)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Ver detalles
        </button>

        {isEnRepertorio ? (
          <button
            type="button"
            className="btn-in-repertory btn-sm"
            onClick={() => setRatingModalPartitura(partitura)}
            title="Ya está en tu repertorio. Haz clic para calificar su dificultad."
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            En mi repertorio • Calificar
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => addToRepertorio(partitura.id)}
            title="Añadir a tus piezas aprendidas y recalcular tu nivel técnico"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Añadir a mi repertorio
          </button>
        )}
      </div>
    </article>
  );
}
