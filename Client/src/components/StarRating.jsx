export default function StarRating({ rating = 0, max = 5, size = 'sm' }) {
  const filled = Math.round(rating);
  return (
    <span className={`text-${size === 'sm' ? '' : 'lg'}`} title={`${rating} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < filled ? '#f5a623' : '#d0d0d0', fontSize: size === 'lg' ? '1.4rem' : '0.9rem' }}>
          ★
        </span>
      ))}
      <small className="text-muted ms-1">({rating.toFixed(1)})</small>
    </span>
  );
}
