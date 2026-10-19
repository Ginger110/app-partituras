import { getDifficultyTier } from '../../utils/difficultyUtils';

export default function BadgeDificultad({ score, size = 'md', showLabel = true, className = '' }) {
  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 1.0;
  const tier = getDifficultyTier(numericScore);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-all shadow-sm ${sizeClasses[size] || sizeClasses.md} ${className}`}
      style={{
        backgroundColor: tier.badgeBg,
        color: tier.badgeText,
        border: `1px solid ${tier.badgeBorder}`
      }}
      title={`Dificultad Dinámica: ${numericScore.toFixed(1)} / 10.0 (${tier.label}). ${tier.description}`}
      aria-label={`Nivel de dificultad ${numericScore.toFixed(1)} de 10, categoría ${tier.label}`}
    >
      <span
        className="rounded-full inline-block animate-pulse"
        style={{
          width: size === 'sm' ? 6 : size === 'lg' ? 10 : 8,
          height: size === 'sm' ? 6 : size === 'lg' ? 10 : 8,
          backgroundColor: tier.dotColor
        }}
      />
      <span className="font-mono font-bold tracking-tight">
        {numericScore.toFixed(1)}
      </span>
      {showLabel && (
        <span className="font-normal opacity-90 border-l pl-1.5 ml-0.5" style={{ borderColor: tier.badgeBorder }}>
          {tier.label}
        </span>
      )}
    </span>
  );
}
