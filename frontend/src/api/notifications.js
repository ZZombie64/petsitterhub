const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, { method = 'GET', token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { method, headers });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Si è verificato un errore imprevisto.');
  }

  return data;
}

export function fetchMyNotifications(token) {
  return request('/notifications/mie', { token });
}

export function markNotificationAsRead(token, id) {
  return request(`/notifications/${id}/letta`, { method: 'PUT', token });
}

export function markAllNotificationsAsRead(token) {
  return request('/notifications/segna-tutte-lette', { method: 'PUT', token });
}
