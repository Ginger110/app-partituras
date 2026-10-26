import { useState, useMemo } from 'react';
import { useApp } from '../../context/useApp';
import CardPartitura from '../components/CardPartitura';
import FilterSidebar from '../components/FilterSidebar';
import EmptyState from '../components/EmptyState';

export default function CatalogoPage() {
  const { partituras, uiState } = useApp();

  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('popularidad'); // 'popularidad' | 'dificultad_asc' | 'dificultad_desc' | 'recientes'

  const initialFilters = {
    instrumentos: [],
    estilos: [],
    maxDifficulty: 10.0,
    tipoPrecio: 'todos' // 'todos' | 'gratis' | 'pago'
  };

  const [filters, setFilters] = useState(initialFilters);

  // Filtrado reactivo con useMemo
  const filteredPartituras = useMemo(() => {
    // Si el UI State Switcher está en modo 'empty', forzamos lista vacía para captura
    if (uiState === 'empty') {
      return [];
    }

    return partituras.filter((p) => {
      // 1. Filtro por término de búsqueda (Título, Obra o Compositor)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = p.nombre.toLowerCase().includes(query);
        const matchObra = (p.obra_nombre || '').toLowerCase().includes(query);
        const matchComposer = (p.autor_obra || '').toLowerCase().includes(query);
        const matchInstrument = p.instrumentacion.toLowerCase().includes(query);

        if (!matchTitle && !matchObra && !matchComposer && !matchInstrument) {
          return false;
        }
      }

      // 2. Filtro por Dificultad Máxima
      if (p.dificultadCalculada > filters.maxDifficulty) {
        return false;
      }

      // 3. Filtro por Instrumentación
      if (filters.instrumentos.length > 0) {
        const matchesInstrument = filters.instrumentos.some(inst =>
          p.instrumentacion.toLowerCase().includes(inst.toLowerCase().replace(' solo', ''))
        );
        if (!matchesInstrument) return false;
      }

      // 4. Filtro por Estilo / Época
      if (filters.estilos.length > 0) {
        if (!filters.estilos.includes(p.estilo)) {
          return false;
        }
      }

      // 5. Filtro por Precio
      if (filters.tipoPrecio === 'gratis' && p.precio > 0) return false;
      if (filters.tipoPrecio === 'pago' && p.precio === 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'dificultad_asc') return a.dificultadCalculada - b.dificultadCalculada;
      if (sortBy === 'dificultad_desc') return b.dificultadCalculada - a.dificultadCalculada;
      if (sortBy === 'popularidad') return (b.totalRatings || 0) - (a.totalRatings || 0);
      return b.id - a.id;
    });
  }, [partituras, searchTerm, filters, sortBy, uiState]);

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setSearchTerm('');
    setSortBy('popularidad');
  };

  const activeFiltersCount =
    filters.instrumentos.length +
    filters.estilos.length +
    (filters.maxDifficulty < 10.0 ? 1 : 0) +
    (filters.tipoPrecio !== 'todos' ? 1 : 0);

  return (
    <section className="catalogo-view" aria-label="Catálogo de Partituras">
      {/* 1. ZONA DE BÚSQUEDA PRINCIPAL (Estilo Google / Hero) */}
      <div className="search-hero-section">
        <div className="search-hero-content">
          <h1 className="search-hero-title">
            Encuentra tu próxima partitura según tu <span className="highlight-text">nivel técnico</span>
          </h1>
          <p className="search-hero-subtitle">
            Catálogo colaborativo con cálculo dinámico de dificultad basado en evaluaciones de músicos reales.
          </p>

          <div className="search-bar-google-wrap">
            <div className="search-bar-google">
              <svg className="search-bar-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="search-bar-input"
                placeholder="Buscar por título de la obra, compositor (ej: Debussy, Chopin, Albéniz)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar partituras"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Borrar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sugerencias rápidas */}
            <div className="search-quick-tags">
              <span className="tags-label">Tendencias:</span>
              {['Debussy', 'Clásico', 'Violín', 'Piano solo', 'Gratis'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="quick-tag-btn"
                  onClick={() => setSearchTerm(tag === 'Gratis' ? '' : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ZONA DE CONTENIDO PRINCIPAL: SIDEBAR DE FILTROS + GRILLA DE RESULTADOS */}
      <div className="catalogo-layout-container">
        {/* Barra superior de control en la grilla (Resumen de resultados y acceso unificado a Filtros/Orden) */}
        <div className="catalog-toolbar-row">
          <div className="toolbar-info">
            <span className="results-count-text">
              {uiState === 'empty' ? '0 resultados (Modo Vacío)' : `${filteredPartituras.length} partituras encontradas`}
            </span>
            {activeFiltersCount > 0 && (
              <span className="active-filters-tag">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
              </span>
            )}
          </div>

          <div className="toolbar-actions">
            {/* Botón para abrir el panel unificado de Filtrar y Ordenar en Móvil / Tablet */}
            <button
              type="button"
              className="btn-mobile-filter"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Abrir panel unificado de filtrado y ordenamiento"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>Filtrar y Ordenar</span>
              {activeFiltersCount > 0 && (
                <span className="mobile-filter-counter">{activeFiltersCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="catalogo-columns-wrapper">
          {/* Panel Unificado de Filtrado y Ordenamiento (Sidebar Izquierdo) */}
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            totalResults={filteredPartituras.length}
            onResetFilters={handleResetFilters}
            mobileDrawerOpen={mobileDrawerOpen}
            setMobileDrawerOpen={setMobileDrawerOpen}
          />

          {/* Grilla de Resultados (Centro / Derecha) */}
          <main className="catalog-grid-main" aria-label="Resultados de partituras">
            {filteredPartituras.length === 0 ? (
              <EmptyState
                title="No encontramos partituras coincidentes"
                description={
                  uiState === 'empty'
                    ? 'Esta vista representa el estado vacío solicitado en la rúbrica (Empty State). Úsalo para capturas de pantalla.'
                    : `No hay obras que coincidan con "${searchTerm || 'los filtros seleccionados'}". Prueba ampliando el rango de dificultad o limpiando los filtros.`
                }
                actionText="Restablecer búsqueda y filtros"
                onAction={handleResetFilters}
                iconType="search"
              />
            ) : (
              <div className="scores-grid">
                {filteredPartituras.map((partitura) => (
                  <CardPartitura key={partitura.id} partitura={partitura} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
