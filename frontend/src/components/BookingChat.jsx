import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchBookingMessages, sendBookingMessage } from '../api/messages';

export default function BookingChat({ bookingId }) {
  const { token, user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  async function loadMessages() {
    setLoading(true);
    try {
      const data = await fetchBookingMessages(token, bookingId);
      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    try {
      await sendBookingMessage(token, bookingId, text);
      setText('');
      loadMessages();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="booking-chat">
      {loading && <p className="page-loading">Caricamento messaggi…</p>}

      <ul className="chat-messages">
        {!loading && messages.length === 0 && (
          <li className="dashboard-empty">Nessun messaggio ancora, scrivi il primo.</li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            className={`chat-message ${m.sender_id === user.id ? 'chat-message-mine' : ''}`}
          >
            <p>{m.content}</p>
            <span className="chat-time">
              {new Date(m.sent_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSend} className="chat-form">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un messaggio…"
        />
        <button type="submit">Invia</button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
