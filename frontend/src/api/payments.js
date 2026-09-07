const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, { method = 'GET', token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { method, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Si è verificato un errore imprevisto.');
  }

  return data;
}

export function createPaymentSession(token, bookingId) {
  return request(`/bookings/${bookingId}/pagamento`, { method: 'POST', token });
}

export function confirmPayment(token, bookingId, sessionId) {
  return request(`/bookings/${bookingId}/pagamento/conferma?session_id=${sessionId}`, { token });
}
