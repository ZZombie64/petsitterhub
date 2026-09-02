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

export function fetchAdminSitters(token, status) {
  const query = status ? `?status=${status}` : '';
  return request(`/admin/sitters${query}`, { token });
}

export function updateSitterVerification(token, sitterId, verification_status) {
  return request(`/admin/sitters/${sitterId}/verifica`, {
    method: 'PUT',
    token,
    body: { verification_status },
  });
}

export function fetchAdminDisputes(token, status) {
  const query = status ? `?status=${status}` : '';
  return request(`/admin/disputes${query}`, { token });
}

export function updateDisputeStatus(token, disputeId, status) {
  return request(`/admin/disputes/${disputeId}`, {
    method: 'PUT',
    token,
    body: { status },
  });
}
