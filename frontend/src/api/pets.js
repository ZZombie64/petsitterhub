const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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

export function fetchMyPets(token) {
  return request('/pets/me', { token });
}

export function addPet(token, payload) {
  return request('/pets', { method: 'POST', token, body: payload });
}

export function updatePet(token, id, payload) {
  return request(`/pets/${id}`, { method: 'PUT', token, body: payload });
}

export function deletePet(token, id) {
  return request(`/pets/${id}`, { method: 'DELETE', token });
}
