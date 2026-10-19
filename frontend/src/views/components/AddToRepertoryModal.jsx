import { useState } from 'react';
import { useApp } from '../../context/useApp';
import BadgeDificultad from './BadgeDificultad';
import { recalcularNivelUsuario } from '../../utils/difficultyUtils';

export default function AddToRepertoryModal() {
  const {
    addRepertoryModalOpen,
    setAddRepertoryModalOpen,
    partituras,
    repertorio,
    user,
    addToRepertorio,
    setCurrentView
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartitura, setSelectedPartitura] = useState(null);

  if (!addRepertoryModalOpen) return null;

  // Filtrar obras no añadidas aún
  const availablePartituras = partituras.filter(
    p => !repertorio.some(r => r.id === p.id)
  );

  const filtered = availablePartituras.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.autor_obra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.instrumentacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Proyección de impacto en nivel
  let projectedRecalc = null;
  if (selectedPartitura) {
    const simRepertorio = [
      { ...selectedPartitura, fecha_agregado: 'hoy', estado_dominio: 'Dominada' },
      ...repertorio
    ];
    projectedRecalc = recalcularNivelUsuario(user.nivel_base, simRepertorio);
  }

  const handleConfirmAdd = () => {
    if (!selectedPartitura) return;
    addToRepertorio(selectedPartitura.id);
    setAddRepertoryModalOpen(false);
    setSelectedPartitura(null);
  };

  const handleGoToCatalog = () => {
    setAddRepertoryModalOpen(false);
    setCurrentView('catalogo');
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => setAddRepertoryModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-repertory-modal-title"
    >
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-icon add-icon-bg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </div>
          <div className="modal-header-text">
            <h2 id="add-repertory-modal-title" className="modal-title">Añadir Obra a Mi Repertorio (CU01)</h2>
            <p className="modal-subtitle">Marca una pieza como tocada/aprendida para recalcular tu nivel técnico</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setAddRepertoryModalOpen(false)}
            aria-label="Cerrar modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="quick-search-box">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar por título, compositor o instrumento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="quick-search-input"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Lista de selección */}
        <div className="repertory-selection-list">
          {filtered.length === 0 ? (
            <div className="selection-empty-hint">
              <p>No se encontraron partituras disponibles con ese término.</p>
              <button
                type="button"
                className="btn-link"
                onClick={handleGoToCatalog}
              >
                Explorar el catálogo completo
              </button>
            </div>
          ) : (
            filtered.map((p) => {
              const isSelected = selectedPartitura?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`repertory-select-item ${isSelected ? 'repertory-select-item-active' : ''}`}
                  onClick={() => setSelectedPartitura(p)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="select-item-radio">
                    <input
                      type="radio"
                      name="selectedScore"
                      checked={isSelected}
                      onChange={() => setSelectedPartitura(p)}
                      aria-label={p.nombre}
                    />
                  </div>
                  <div className="select-item-info">
                    <div className="select-item-title">{p.nombre}</div>
                    <div className="select-item-meta">
                      {p.autor_obra} • {p.instrumentacion} • {p.estilo}
                    </div>
                  </div>
                  <div className="select-item-badge">
                    <BadgeDificultad score={p.dificultadCalculada} size="sm" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Previsualización del recálculo del nivel */}
        {selectedPartitura && projectedRecalc && (
          <div className="repertory-impact-preview">
            <div className="impact-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              <strong>Simulación de Impacto en tu Nivel Técnico</strong>
            </div>
            <div className="impact-comparison">
              <div>
                <span className="caption-text">Nivel actual:</span>
                <span className="font-mono font-bold text-lg">{user.nivel_tecnico.toFixed(1)}</span>
              </div>
              <span className="impact-arrow">➔</span>
              <div>
                <span className="caption-text">Nuevo nivel proyectado:</span>
                <span className="font-mono font-bold text-lg text-success">
                  {projectedRecalc.nuevoNivel.toFixed(1)}
                </span>
                <span className="impact-delta font-mono">
                  ({projectedRecalc.delta >= 0 ? '+' : ''}{projectedRecalc.delta.toFixed(1)})
                </span>
              </div>
            </div>
            <p className="impact-subtext">{projectedRecalc.mensaje}</p>
          </div>
        )}

        {/* Footer */}
        <div className="modal-actions-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setAddRepertoryModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedPartitura}
            onClick={handleConfirmAdd}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Confirmar y Recalcular Nivel
          </button>
        </div>
      </div>
    </div>
  );
}
