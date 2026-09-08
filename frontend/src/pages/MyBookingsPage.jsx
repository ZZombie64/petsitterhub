import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyBookings, cancelBooking, completeBooking, createReview } from '../api/bookings';
import { createPaymentSession, confirmPayment } from '../api/payments';
import BookingChat from '../components/BookingChat';

const STATUS_LABELS = {
  richiesta: 'In attesa di risposta',
  accettata: 'Accettata (in attesa di pagamento)',
  confermata: 'Confermata',
  completata: 'Completata',
  annullata: 'Annullata',
};

// Trasforma una data grezza (es. 2026-09-07T22:00:00.000Z) in 07/09/2026
function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString('it-IT');
}

// Tiene solo HH:MM da un orario tipo 14:30:00
function formatTime(value) {
  if (!value) return '';
  return value.slice(0, 5);
}

export default function MyBookingsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [reviewForm, setReviewForm] = useState({});

  async function loadBookings() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyBookings(token);
      setBookings(data.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al ritorno dal redirect di Stripe, confermiamo il pagamento col backend
  useEffect(() => {
    const esito = searchParams.get('pagamento');
    const sessionId = searchParams.get('session_id');
    const bookingId = searchParams.get('booking_id');

    if (esito === 'successo' && sessionId && bookingId) {
      confirmPayment(token, bookingId, sessionId)
        .then(() => {
          setPaymentMessage('Pagamento confermato! La prenotazione è ora "confermata".');
          loadBookings();
        })
        .catch((err) => setPaymentMessage(err.message))
        .finally(() => setSearchParams({}));
    } else if (esito === 'annullato') {
      setPaymentMessage('Pagamento annullato.');
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancel(id) {
    try {
      await cancelBooking(token, id);
      loadBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComplete(id) {
    try {
      await completeBooking(token, id);
      loadBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReview(id) {
    const dati = reviewForm[id] || {};
    try {
      await createReview(token, id, {
        rating: Number(dati.rating) || 5,
        comment: dati.comment || '',
      });
      setReviewForm({ ...reviewForm, [id]: undefined });
      loadBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePay(id) {
    setPayingId(id);
    setError(null);
    try {
      const data = await createPaymentSession(token, id);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setPayingId(null);
    }
  }

  if (loading) return <p className="page-loading">Caricamento…</p>;

  return (
    <div className="sitter-dashboard">
      <h1>Le mie prenotazioni</h1>

      {paymentMessage && <p className="form-hint">{paymentMessage}</p>}
      {error && <p className="form-error">{error}</p>}

      <ul className="dashboard-list">
        {bookings.length === 0 && (
          <li className="dashboard-empty">Non hai ancora nessuna prenotazione.</li>
        )}
        {bookings.map((b) => (
          <li key={b.id} className="dashboard-list-item-column">
            <div className="dashboard-list-item">
              <span>
                <strong>{b.sitter_name}</strong> — {b.service_type} ({b.pet_name})
                <br />
                {formatDate(b.start_date)} → {formatDate(b.end_date)}
                {b.start_time && b.end_time ? ` · ${formatTime(b.start_time)}–${formatTime(b.end_time)}` : ''}
                {' · '}{Number(b.total_price).toFixed(2)} €
              </span>
              <span>
                <span className={`status-badge status-${b.status}`}>
                  {STATUS_LABELS[b.status] || b.status}
                </span>{' '}
                <button
                  className="chat-toggle"
                  onClick={() => setOpenChatId(openChatId === b.id ? null : b.id)}
                >
                  {openChatId === b.id ? 'Chiudi chat' : '💬 Chat'}
                </button>
                {b.status === 'richiesta' && (
                  <>
                    {' '}
                    <button className="link-danger" onClick={() => handleCancel(b.id)}>
                      Annulla
                    </button>
                  </>
                )}
                {b.status === 'accettata' && (
                  <>
                    {' '}
                    <button onClick={() => handlePay(b.id)} disabled={payingId === b.id}>
                      {payingId === b.id ? 'Reindirizzamento…' : 'Paga ora'}
                    </button>
                  </>
                )}
                {b.status === 'confermata' && (
                  <>
                    {' '}
                    <button onClick={() => handleComplete(b.id)}>
                      Segna come completato
                    </button>
                  </>
                )}
              </span>
            </div>
            {b.status === 'completata' && (
              <div className="review-box">
                <strong>Lascia una recensione</strong>
                <label>
                  Voto
                  <select
                    value={(reviewForm[b.id] && reviewForm[b.id].rating) || '5'}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        [b.id]: { ...reviewForm[b.id], rating: e.target.value },
                      })
                    }
                  >
                    <option value="5">5 ★</option>
                    <option value="4">4 ★</option>
                    <option value="3">3 ★</option>
                    <option value="2">2 ★</option>
                    <option value="1">1 ★</option>
                  </select>
                </label>
                <textarea
                  placeholder="Com'è andata? (facoltativo)"
                  value={(reviewForm[b.id] && reviewForm[b.id].comment) || ''}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      [b.id]: { ...reviewForm[b.id], comment: e.target.value },
                    })
                  }
                />
                <button onClick={() => handleReview(b.id)}>Invia recensione</button>
              </div>
            )}
            {openChatId === b.id && <BookingChat bookingId={b.id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
