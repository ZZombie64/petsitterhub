const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || 'Si è verificato un errore imprevisto.';
    const err = new Error(message);
    err.details = data.details;
    throw err;
  }

  return data;
}

export function createBooking(token, payload) {
  return request('/bookings', { method: 'POST', token, body: payload });
}

export function fetchMyBookings(token) {
  return request('/bookings/mie', { token });
}

export function cancelBooking(token, id) {
  return request(`/bookings/${id}/annulla`, { method: 'PUT', token });
}

export function fetchReceivedBookings(token) {
  return request('/bookings/ricevute', { token });
}

export function acceptBooking(token, id) {
  return request(`/bookings/${id}/accetta`, { method: 'PUT', token });
}

export function rejectBooking(token, id) {
  return request(`/bookings/${id}/rifiuta`, { method: 'PUT', token });
}
