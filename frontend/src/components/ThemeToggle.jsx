import { useEffect, useState } from 'react';

// Bottone che accende/spegne la modalità scura.
// Ricorda la scelta dell'utente per le visite successive.
export default function ThemeToggle() {
  // Legge la scelta salvata; se non c'è, parte in modalità chiara.
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // Ogni volta che cambia, aggiorna il sito e salva la scelta.
  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setDark(!dark)}
      aria-label="Cambia tema chiaro/scuro"
      title="Cambia tema"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
