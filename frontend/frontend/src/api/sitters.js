const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Recupera il catalogo sitter, applicando solo i filtri effettivamente
 * compilati (i campi vuoti non vengono inviati al backend).
 */
export async function fetchSitters(filters = {}) {
  const params = new URLSearchParams();

  if (filters.citta) params.set('citta', filters.citta);
  if (filters.animale) params.set('animale', filters.animale);
  if (filters.servizio) params.set('servizio', filters.servizio);
  if (filters.data) params.set('data', filters.data);

  const query = params.toString();
  const response = await fetch(`${API_URL}/sitters${query ? `?${query}` : ''}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Impossibile caricare il catalogo sitter.');
  }

  return data.sitters;
}

export async function fetchSitterDetail(id) {
  const response = await fetch(`${API_URL}/sitters/${id}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Sitter non trovato.');
  }

  return data.sitter;
}
