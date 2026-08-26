const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Wrapper minimale su fetch: aggiunge l'header JSON, gestisce gli
 * errori del backend e restituisce direttamente i dati già parsati.
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Il backend restituisce { error, details? } in caso di problemi
    const message = data.error || 'Si è verificato un errore imprevisto.';
    const err = new Error(message);
    err.details = data.details;
    throw err;
  }

  return data;
}

export function registerUser(payload) {
  return request('/auth/register', { method: 'POST', body: payload });
}

export function loginUser(payload) {
  return request('/auth/login', { method: 'POST', body: payload });
}

export function fetchMe(token) {
  return request('/auth/me', { token });
}
