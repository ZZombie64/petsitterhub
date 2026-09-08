// Mostra la valutazione in stelle (es. 4.5 su 5).
// Se non ci sono recensioni, lo dice.
export default function StarRating({ media, numero }) {
  const voto = Number(media) || 0;

  if (!numero || numero === 0) {
    return <span className="star-rating star-rating-empty">Nessuna recensione</span>;
  }

  const pieni = Math.round(voto);
  const stelle = '★'.repeat(pieni) + '☆'.repeat(5 - pieni);

  return (
    <span className="star-rating" title={`${voto} su 5`}>
      <span className="star-rating-stars">{stelle}</span>
      <span className="star-rating-value">{voto} ({numero})</span>
    </span>
  );
}
