import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMySitterProfile,
  updateMySitterProfile,
  addSitterService,
  deleteSitterService,
  addSitterAvailability,
  deleteSitterAvailability,
  uploadSitterPhoto,
  uploadSitterPlacePhoto,
} from '../api/sitterProfile';
import { fetchReceivedBookings, acceptBooking, rejectBooking, fetchMyEarnings } from '../api/bookings';
import { fetchSitterReviews } from '../api/sitters';
import BookingChat from '../components/BookingChat';

const BOOKING_STATUS_LABELS = {
  richiesta: 'In attesa',
  accettata: 'Accettata (in attesa di pagamento)',
  confermata: 'Confermata',
  completata: 'Completata',
  annullata: 'Annullata',
};

const STATUS_LABELS = {
  in_attesa: 'In attesa di verifica',
  approvato: 'Approvato',
  rifiutato: 'Rifiutato',
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

export default function SitterDashboardPage() {
  const { token } = useAuth();

  const [sitter, setSitter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);

  // Form profilo
  const [profileForm, setProfileForm] = useState({ bio: '', accepted_pets: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Form nuovo servizio
  const [serviceForm, setServiceForm] = useState({ type: '', price: '', unit: 'ora' });
  const [serviceError, setServiceError] = useState(null);

  // Form nuova disponibilità
  const [availabilityForm, setAvailabilityForm] = useState({ day: '', start_time: '', end_time: '' });
  const [availabilityError, setAvailabilityError] = useState(null);

  // Richieste di prenotazione ricevute
  const [bookings, setBookings] = useState([]);
  const [bookingsError, setBookingsError] = useState(null);
  const [photoMessage, setPhotoMessage] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [reviews, setReviews] = useState([]);

  async function loadBookings() {
    try {
      const data = await fetchReceivedBookings(token);
      setBookings(data.bookings);
    } catch (err) {
      setBookingsError(err.message);
    }
  }

  async function handleAcceptBooking(id) {
    try {
      await acceptBooking(token, id);
      loadBookings();
    } catch (err) {
      setBookingsError(err.message);
    }
  }

  async function handleRejectBooking(id) {
    try {
      await rejectBooking(token, id);
      loadBookings();
    } catch (err) {
      setBookingsError(err.message);
    }
  }

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMySitterProfile(token);
      setSitter(data.sitter);
      setProfileForm({
        bio: data.sitter.bio || '',
        accepted_pets: data.sitter.accepted_pets || '',
      });
      // Carico guadagni e recensioni ricevute
      fetchMyEarnings(token).then(setEarnings).catch(() => setEarnings(null));
      fetchSitterReviews(data.sitter.sitter_id).then(setReviews).catch(() => setReviews([]));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await updateMySitterProfile(token, profileForm);
      setProfileMessage('Profilo aggiornato.');
      loadProfile();
    } catch (err) {
      setProfileMessage(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoMessage('Caricamento in corso…');
    try {
      await uploadSitterPhoto(token, file);
      setPhotoMessage('Foto profilo caricata.');
      loadProfile();
    } catch (err) {
      setPhotoMessage(err.message);
    }
  }

  async function handleUploadPlacePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoMessage('Caricamento in corso…');
    try {
      await uploadSitterPlacePhoto(token, file);
      setPhotoMessage('Foto ambiente caricata.');
      loadProfile();
    } catch (err) {
      setPhotoMessage(err.message);
    }
  }

  async function handleAddService(e) {
    e.preventDefault();
    setServiceError(null);
    try {
      await addSitterService(token, {
        ...serviceForm,
        price: Number(serviceForm.price),
      });
      setServiceForm({ type: '', price: '', unit: 'ora' });
      loadProfile();
    } catch (err) {
      setServiceError(err.message);
    }
  }

  async function handleDeleteService(id) {
    try {
      await deleteSitterService(token, id);
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddAvailability(e) {
    e.preventDefault();
    setAvailabilityError(null);
    try {
      await addSitterAvailability(token, availabilityForm);
      setAvailabilityForm({ day: '', start_time: '', end_time: '' });
      loadProfile();
    } catch (err) {
      setAvailabilityError(err.message);
    }
  }

  async function handleDeleteAvailability(id) {
    try {
      await deleteSitterAvailability(token, id);
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="page-loading">Caricamento…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!sitter) return null;

  return (
    <div className="sitter-dashboard">
      <h1>Il tuo profilo sitter</h1>

      <span className={`status-badge status-${sitter.verification_status}`}>
        {STATUS_LABELS[sitter.verification_status] || sitter.verification_status}
      </span>

      {sitter.verification_status === 'in_attesa' && (
        <p className="dashboard-hint">
          Il tuo profilo è in attesa di verifica da parte di un amministratore.
          Nel frattempo puoi comunque configurare bio, servizi e disponibilità.
        </p>
      )}

      {/* --- Profilo --- */}
      <section className="dashboard-section">
        <h2>Profilo</h2>
        <form onSubmit={handleProfileSubmit} className="dashboard-form">
          <label>
            Bio
            <textarea
              rows={3}
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              placeholder="Racconta la tua esperienza con gli animali…"
            />
          </label>
          <label>
            Animali accettati
            <input
              type="text"
              value={profileForm.accepted_pets}
              onChange={(e) => setProfileForm({ ...profileForm, accepted_pets: e.target.value })}
              placeholder="es. cani, gatti"
            />
          </label>
          <button type="submit" disabled={savingProfile}>
            {savingProfile ? 'Salvataggio…' : 'Salva profilo'}
          </button>
          {profileMessage && <p className="form-hint">{profileMessage}</p>}
        </form>
      </section>

      {/* --- Foto --- */}
      <section className="dashboard-section">
        <h2>Foto</h2>
        <p className="form-hint">
          Carica una tua foto e una dell'ambiente dove ospiti gli animali:
          aiuta i proprietari a fidarsi e a vedere dove lasceranno il loro animale.
        </p>

        <div className="photo-upload-grid">
          <div className="photo-upload-item">
            <span className="photo-upload-label">La tua foto</span>
            {sitter.photo_url ? (
              <img src={sitter.photo_url} alt="Foto del sitter" className="photo-preview" />
            ) : (
              <div className="photo-placeholder">Nessuna foto</div>
            )}
            <input type="file" accept="image/*" onChange={handleUploadPhoto} />
          </div>

          <div className="photo-upload-item">
            <span className="photo-upload-label">Ambiente</span>
            {sitter.place_photo_url ? (
              <img src={sitter.place_photo_url} alt="Ambiente del sitter" className="photo-preview" />
            ) : (
              <div className="photo-placeholder">Nessuna foto</div>
            )}
            <input type="file" accept="image/*" onChange={handleUploadPlacePhoto} />
          </div>
        </div>
        {photoMessage && <p className="form-hint">{photoMessage}</p>}
      </section>

      {/* --- Servizi --- */}
      <section className="dashboard-section">
        <h2>Servizi offerti</h2>

        <ul className="dashboard-list">
          {sitter.services.length === 0 && <li className="dashboard-empty">Nessun servizio ancora aggiunto.</li>}
          {sitter.services.map((s) => (
            <li key={s.id} className="dashboard-list-item">
              <span>{s.type} — {Number(s.price).toFixed(2)} € / {s.unit}</span>
              <button className="link-danger" onClick={() => handleDeleteService(s.id)}>Rimuovi</button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddService} className="dashboard-form inline-form">
          <input
            type="text"
            placeholder="Tipo (es. passeggiata)"
            value={serviceForm.type}
            onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Prezzo €"
            value={serviceForm.price}
            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            required
          />
          <select
            value={serviceForm.unit}
            onChange={(e) => setServiceForm({ ...serviceForm, unit: e.target.value })}
          >
            <option value="ora">a ora</option>
            <option value="giorno">al giorno</option>
            <option value="notte">a notte</option>
            <option value="servizio">a servizio</option>
          </select>
          <button type="submit">Aggiungi servizio</button>
        </form>
        {serviceError && <p className="form-error">{serviceError}</p>}
      </section>

      {/* --- Disponibilità --- */}
      <section className="dashboard-section">
        <h2>Disponibilità</h2>

        <ul className="dashboard-list">
          {sitter.availability.length === 0 && <li className="dashboard-empty">Nessuna disponibilità impostata.</li>}
          {sitter.availability.map((a) => (
            <li key={a.id} className="dashboard-list-item">
              <span>
                {formatDate(a.day)} · {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                {a.is_booked && <span className="badge-booked"> Prenotata</span>}
              </span>
              {!a.is_booked && (
                <button className="link-danger" onClick={() => handleDeleteAvailability(a.id)}>Rimuovi</button>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddAvailability} className="dashboard-form inline-form">
          <input
            type="date"
            value={availabilityForm.day}
            onChange={(e) => setAvailabilityForm({ ...availabilityForm, day: e.target.value })}
            required
          />
          <input
            type="time"
            value={availabilityForm.start_time}
            onChange={(e) => setAvailabilityForm({ ...availabilityForm, start_time: e.target.value })}
            required
          />
          <input
            type="time"
            value={availabilityForm.end_time}
            onChange={(e) => setAvailabilityForm({ ...availabilityForm, end_time: e.target.value })}
            required
          />
          <button type="submit">Aggiungi disponibilità</button>
        </form>
        {availabilityError && <p className="form-error">{availabilityError}</p>}
      </section>

      {/* --- Richieste di prenotazione --- */}
      <section className="dashboard-section">
        <h2>Richieste</h2>

        {bookingsError && <p className="form-error">{bookingsError}</p>}

        <ul className="dashboard-list">
          {bookings.length === 0 && (
            <li className="dashboard-empty">Nessuna richiesta ricevuta finora.</li>
          )}
          {bookings.map((b) => (
            <li key={b.id} className="dashboard-list-item-column">
              <div className="dashboard-list-item">
                <span>
                  <strong>{b.owner_name}</strong> — {b.service_type} per {b.pet_name} ({b.pet_species})
                  <br />
                  {formatDate(b.start_date)} → {formatDate(b.end_date)}
                  {b.start_time && b.end_time ? ` · ${formatTime(b.start_time)}–${formatTime(b.end_time)}` : ''}
                  {' · '}{Number(b.total_price).toFixed(2)} €
                </span>
                <span>
                  <span className={`status-badge status-${b.status}`}>
                    {BOOKING_STATUS_LABELS[b.status] || b.status}
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
                      <button onClick={() => handleAcceptBooking(b.id)}>Accetta</button>{' '}
                      <button className="link-danger" onClick={() => handleRejectBooking(b.id)}>
                        Rifiuta
                      </button>
                    </>
                  )}
                </span>
              </div>
              {openChatId === b.id && <BookingChat bookingId={b.id} />}
            </li>
          ))}
        </ul>
      </section>

      {/* --- Guadagni --- */}
      <section className="dashboard-section">
        <h2>Guadagni</h2>
        {!earnings || earnings.numero === 0 ? (
          <p className="dashboard-empty">Ancora nessun incasso.</p>
        ) : (
          <>
            <p className="earnings-total">
              Totale incassato: <strong>{Number(earnings.totale).toFixed(2)} €</strong>
              {' '}({earnings.numero} {earnings.numero === 1 ? 'pagamento' : 'pagamenti'})
            </p>
            <ul className="dashboard-list">
              {earnings.dettaglio.map((d) => (
                <li key={d.id} className="dashboard-list-item">
                  <span>
                    {d.service_type} per {d.pet_name} — {d.owner_name}
                    <br />
                    {formatDate(d.paid_at)}
                  </span>
                  <span><strong>{Number(d.amount).toFixed(2)} €</strong></span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* --- Recensioni ricevute --- */}
      <section className="dashboard-section">
        <h2>Recensioni ricevute</h2>
        {reviews.length === 0 ? (
          <p className="dashboard-empty">Non hai ancora ricevuto recensioni.</p>
        ) : (
          <ul className="reviews-list">
            {reviews.map((r, i) => (
              <li key={i} className="review-item">
                <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <strong> {r.autore}</strong>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
