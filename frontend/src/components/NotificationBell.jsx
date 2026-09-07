import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notifications';

const POLL_INTERVAL_MS = 30000;

export default function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  async function load() {
    try {
      const data = await fetchMyNotifications(token);
      setNotifications(data.notifications);
    } catch {
      // Silenzioso: un errore nel caricare le notifiche non deve bloccare la navbar.
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleItemClick(n) {
    if (n.is_read) return;
    try {
      await markNotificationAsRead(token, n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    } catch {
      // ignora: non critico per l'utente
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignora
    }
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button className="notification-bell-toggle" onClick={() => setOpen((o) => !o)}>
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <strong>Notifiche</strong>
            {unreadCount > 0 && (
              <button className="chat-toggle" onClick={handleMarkAll}>Segna tutte lette</button>
            )}
          </div>
          <ul className="notification-list">
            {notifications.length === 0 && (
              <li className="dashboard-empty">Nessuna notifica.</li>
            )}
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notification-item ${n.is_read ? '' : 'notification-item-unread'}`}
                onClick={() => handleItemClick(n)}
              >
                <p>{n.content}</p>
                <span className="chat-time">
                  {new Date(n.created_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
