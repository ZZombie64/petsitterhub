const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Le rotte DELETE rispondono 204 senza corpo: niente da parsare
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || 'Si è verificato un errore imprevisto.';
    const err = new Error(message);
    err.details = data.details;
    throw err;
  }

  return data;
}

export function fetchMySitterProfile(token) {
  return request('/sitters/me', { token });
}

export function updateMySitterProfile(token, payload) {
  return request('/sitters/me', { method: 'PUT', token, body: payload });
}

export function addSitterService(token, payload) {
  return request('/sitters/me/services', { method: 'POST', token, body: payload });
}

export function deleteSitterService(token, id) {
  return request(`/sitters/me/services/${id}`, { method: 'DELETE', token });
}

export function addSitterAvailability(token, payload) {
  return request('/sitters/me/availability', { method: 'POST', token, body: payload });
}

export function deleteSitterAvailability(token, id) {
  return request(`/sitters/me/availability/${id}`, { method: 'DELETE', token });
}
