export default function EmptyState({
  title = 'No se encontraron resultados',
  description = 'Intenta ajustar los filtros o el término de búsqueda para encontrar más partituras.',
  actionText,
  onAction,
  iconType = 'search'
}) {
  return (
    <div className="empty-state-card" role="region" aria-label="Sin resultados">
      <div className="empty-state-illustration">
        {iconType === 'music' ? (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        ) : iconType === 'heart' ? (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
          </svg>
        ) : (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        )}
      </div>

      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>

      {actionText && onAction && (
        <button
          type="button"
          className="btn-primary empty-state-cta"
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
