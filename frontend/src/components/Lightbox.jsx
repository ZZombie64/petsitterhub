import { useEffect } from 'react';

// Finestra a schermo intero che mostra un'immagine ingrandita.
// Si chiude cliccando lo sfondo, la X, o premendo Esc.
export default function Lightbox({ src, alt, onClose }) {
  // Chiusura con il tasto Esc
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Chiudi">×</button>
      {/* stopPropagation: cliccare sull'immagine non chiude, solo lo sfondo chiude */}
      <img
        src={src}
        alt={alt || ''}
        className="lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
