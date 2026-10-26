const INSTRUMENTOS_DISPONIBLES = [
  'Piano solo',
  'Violín',
  'Guitarra',
  'Violonchelo'
];

const ESTILOS_DISPONIBLES = [
  'Barroco',
  'Clásico',
  'Romántico',
  'Impresionista',
  'Jazz'
];

export default function FilterSidebar({
  filters,
  setFilters,
  sortBy,
  setSortBy,
  totalResults,
  onResetFilters,
  mobileDrawerOpen,
  setMobileDrawerOpen
}) {
  const handleInstrumentChange = (inst) => {
    const exists = filters.instrumentos.includes(inst);
    const updated = exists
      ? filters.instrumentos.filter(i => i !== inst)
      : [...filters.instrumentos, inst];
    setFilters(prev => ({ ...prev, instrumentos: updated }));
  };

  const handleEstiloChange = (estilo) => {
    const exists = filters.estilos.includes(estilo);
    const updated = exists
      ? filters.estilos.filter(e => e !== estilo)
      : [...filters.estilos, estilo];
    setFilters(prev => ({ ...prev, estilos: updated }));
  };

  const handleDifficultyChange = (field, value) => {
    const num = parseFloat(value);
    setFilters(prev => ({
      ...prev,
      [field]: num
    }));
  };

  const sidebarContent = (
    <div className="filter-sidebar-inner">
      <div className="filter-header-row">
        <div className="filter-title-group">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <h2 className="filter-main-title">Filtrar y Ordenar</h2>
        </div>

        {/* Botón de cerrar drawer en móvil */}
        {mobileDrawerOpen && (
          <button
            type="button"
            className="mobile-close-filters-btn"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Cerrar panel de filtros y ordenamiento"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="filter-stats-badge">
        <span>Mostrando <strong>{totalResults}</strong> partituras</span>
      </div>

      {/* 1. SECCIÓN DE ORDENAMIENTO UNIFICADA */}
      <div className="filter-group">
        <label className="filter-group-title" htmlFor="sidebar-sort-select">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="14" y2="12"></line>
            <line x1="4" y1="18" x2="8" y2="18"></line>
          </svg>
          <span>Ordenar Catálogo</span>
        </label>
        <p className="filter-help-text">
          Reorganiza la lista según tu preferencia técnica o popularidad.
        </p>
        <div className="sort-select-wrapper sidebar-sort-wrapper">
          <select
            id="sidebar-sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar partituras por criterio"
          >
            <option value="popularidad">Más valoradas / Populares</option>
            <option value="dificultad_asc">Dificultad: Menor a Mayor</option>
            <option value="dificultad_desc">Dificultad: Mayor a Menor</option>
            <option value="recientes">Más recientes</option>
          </select>
        </div>
      </div>

      {/* 2. FILTRO: DIFICULTAD TÉCNICA DINÁMICA */}
      <div className="filter-group">
        <label className="filter-group-title" htmlFor="filter-diff-max">
          <span>Dificultad Técnica Máxima</span>
          <span className="diff-current-val font-mono">{filters.maxDifficulty.toFixed(1)} / 10.0</span>
        </label>
        <p className="filter-help-text">
          Filtra por el nivel dinámico calculado colectivamente.
        </p>
        <input
          id="filter-diff-max"
          type="range"
          min="1.0"
          max="10.0"
          step="0.5"
          value={filters.maxDifficulty}
          onChange={(e) => handleDifficultyChange('maxDifficulty', e.target.value)}
          className="filter-range-slider"
        />
        <div className="range-labels font-mono">
          <span>1.0 (Principiante)</span>
          <span>5.0</span>
          <span>10.0 (Virtuoso)</span>
        </div>
      </div>

      {/* 3. FILTRO: INSTRUMENTO */}
      <div className="filter-group">
        <span className="filter-group-title">Instrumentación</span>
        <div className="filter-checkbox-list">
          {INSTRUMENTOS_DISPONIBLES.map((inst) => {
            const isChecked = filters.instrumentos.includes(inst);
            return (
              <label key={inst} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleInstrumentChange(inst)}
                  className="filter-checkbox"
                />
                <span className="checkbox-text">{inst}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. FILTRO: ÉPOCA / ESTILO / GÉNERO */}
      <div className="filter-group">
        <span className="filter-group-title">Época / Estilo / Género</span>
        <div className="filter-checkbox-list">
          {ESTILOS_DISPONIBLES.map((estilo) => {
            const isChecked = filters.estilos.includes(estilo);
            return (
              <label key={estilo} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleEstiloChange(estilo)}
                  className="filter-checkbox"
                />
                <span className="checkbox-text">{estilo}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. FILTRO: PRECIO / ACCESO LIBRE (3 OPCIONES EN RECUADROS HOMOGÉNEOS) */}
      <div className="filter-group">
        <span className="filter-group-title">Acceso y Licencia</span>
        <div className="filter-options-segmented" role="radiogroup" aria-label="Filtro de licencia y precio">
          <label className={`segmented-option-card ${filters.tipoPrecio === 'todos' ? 'segmented-option-active' : ''}`}>
            <input
              type="radio"
              name="precioFilter"
              value="todos"
              checked={filters.tipoPrecio === 'todos'}
              onChange={() => setFilters(prev => ({ ...prev, tipoPrecio: 'todos' }))}
              className="segmented-radio-hidden"
            />
            <span className="segmented-option-label">Todas las obras</span>
          </label>

          <label className={`segmented-option-card ${filters.tipoPrecio === 'gratis' ? 'segmented-option-active' : ''}`}>
            <input
              type="radio"
              name="precioFilter"
              value="gratis"
              checked={filters.tipoPrecio === 'gratis'}
              onChange={() => setFilters(prev => ({ ...prev, tipoPrecio: 'gratis' }))}
              className="segmented-radio-hidden"
            />
            <span className="segmented-option-label">Solo Acceso Libre (Gratis)</span>
          </label>

          <label className={`segmented-option-card ${filters.tipoPrecio === 'pago' ? 'segmented-option-active' : ''}`}>
            <input
              type="radio"
              name="precioFilter"
              value="pago"
              checked={filters.tipoPrecio === 'pago'}
              onChange={() => setFilters(prev => ({ ...prev, tipoPrecio: 'pago' }))}
              className="segmented-radio-hidden"
            />
            <span className="segmented-option-label">Ediciones de Pago</span>
          </label>
        </div>
      </div>

      {/* BOTÓN LIMPIAR FILTROS Y ORDEN */}
      <div className="filter-actions">
        <button
          type="button"
          className="btn-secondary btn-full"
          onClick={onResetFilters}
          title="Restablecer todos los filtros y criterio de ordenamiento al estado original"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>Restablecer Filtros y Orden</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar fijo en Desktop (>= 1024px) */}
      <aside className="catalog-sidebar-desktop" aria-label="Panel unificado de filtrado y ordenamiento">
        {sidebarContent}
      </aside>

      {/* Cajón emergente (Drawer) para móvil y tablet (<= 1023px) */}
      {mobileDrawerOpen && (
        <div className="mobile-filter-drawer-backdrop" onClick={() => setMobileDrawerOpen(false)}>
          <div
            className="mobile-filter-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Panel de filtrado y ordenamiento móvil"
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
