import { getDifficultyTier } from '../../utils/difficultyUtils';

export default function BadgeDificultad({ score, size = 'md', showLabel = true, className = '' }) {
  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 1.0;
  const tier = getDifficultyTier(numericScore);
  const formattedScore = numericScore.toFixed(1);

  return (
    <span
      className={`badge-dificultad badge-dificultad-${size} ${className}`}
      style={{
        backgroundColor: tier.badgeBg,
        color: tier.badgeText,
        borderColor: tier.badgeBorder
      }}
      title={`Dificultad Dinámica: ${formattedScore} / 10.0 (${tier.label}). ${tier.description}`}
      aria-label={`Nivel de dificultad ${formattedScore} de 10, categoría ${tier.label}`}
    >
      <span
        className="badge-dificultad-dot"
        style={{
          width: size === 'sm' ? 6 : size === 'lg' ? 10 : 8,
          height: size === 'sm' ? 6 : size === 'lg' ? 10 : 8,
          backgroundColor: tier.dotColor
        }}
      />
      <span className="badge-dificultad-score font-mono font-bold">
        {formattedScore}
      </span>
      {showLabel && (
        <span
          className="badge-dificultad-label"
          style={{ borderColor: tier.badgeBorder }}
        >
          {tier.label}
        </span>
      )}
    </span>
  );
}
