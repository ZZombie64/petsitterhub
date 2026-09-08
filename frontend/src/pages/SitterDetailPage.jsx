import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSitterDetail, fetchSitterReviews } from '../api/sitters';
import { fetchMyPets } from '../api/pets';
import { createBooking } from '../api/bookings';
import StarRating from '../components/StarRating';

const initialForm = { service_id: '', pet_id: '', start_date: '', end_date: '', start_time: '', end_time: '' };

export default function SitterDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [sitter, setSitter] = useState(null);
  const [pets, setPets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSitterDetail(id)
      .then(setSitter)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    fetchSitterReviews(id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [id]);

  useEffect(() => {
    if (user?.role === 'owner') {
      fetchMyPets(token)
        .then((data) => setPets(data.pets))
        .catch(() => {});
    }
  }, [user, token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(false);
    setSubmitting(true);

    try {
      await createBooking(token, {
        sitter_id: sitter.sitter_id,
        service_id: Number(form.service_id),
        pet_id: Number(form.pet_id),
        start_date: form.start_date,
        end_date: form.end_date,
        start_time: form.start_time,
        end_time: form.end_time,
      });
      setBookingSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="page-loading">Caricamento…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!sitter) return null;

  return (
    <div className="sitter-detail-page">
      <h1>{sitter.full_name}</h1>
      <p className="sitter-city">{sitter.city || 'Città non indicata'}</p>
      <StarRating media={sitter.media_voti} numero={Number(sitter.numero_recensioni)} />

      {(sitter.photo_url || sitter.place_photo_url) && (
        <div className="sitter-photos">
          {sitter.photo_url && (
            <figure className="sitter-photo">
              <img src={sitter.photo_url} alt={`Foto di ${sitter.full_name}`} />
              <figcaption>Il sitter</figcaption>
            </figure>
          )}
          {sitter.place_photo_url && (
            <figure className="sitter-photo">
              <img src={sitter.place_photo_url} alt="Ambiente dove vengono ospitati gli animali" />
              <figcaption>Dove starà il tuo animale</figcaption>
            </figure>
          )}
        </div>
      )}

      {sitter.bio && <p className="sitter-bio">{sitter.bio}</p>}

      {sitter.accepted_pets && (
        <p className="sitter-pets">
          <strong>Animali accettati:</strong> {sitter.accepted_pets}
        </p>
      )}

      <section className="dashboard-section">
        <h2>Servizi offerti</h2>
        <ul className="sitter-services">
          {sitter.services.map((s) => (
            <li key={s.id}>{s.type} — {Number(s.price).toFixed(2)} € / {s.unit}</li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section">
        <h2>Prossime disponibilità</h2>
        <ul className="dashboard-list">
          {sitter.availability.length === 0 && (
            <li className="dashboard-empty">Nessuna disponibilità futura indicata.</li>
          )}
          {sitter.availability.map((a) => (
            <li key={a.id} className="dashboard-list-item">
              {a.day} · {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section">
        <h2>Prenota</h2>

        {!user && (
          <p className="dashboard-hint">
            Devi <Link to="/accedi">accedere</Link> come proprietario per prenotare.
          </p>
        )}

        {user && user.role !== 'owner' && (
          <p className="dashboard-hint">Solo un account proprietario può prenotare un servizio.</p>
        )}

        {user && user.role === 'owner' && (
          <>
            {pets.length === 0 ? (
              <p className="dashboard-hint">
                Devi prima aggiungere almeno un animale dal tuo <Link to="/profilo">profilo</Link>.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="dashboard-form">
                <label>
                  Servizio
                  <select
                    value={form.service_id}
                    onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                    required
                  >
                    <option value="" disabled>Scegli un servizio…</option>
                    {sitter.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.type} — {Number(s.price).toFixed(2)} € / {s.unit}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Animale
                  <select
                    value={form.pet_id}
                    onChange={(e) => setForm({ ...form, pet_id: e.target.value })}
                    required
                  >
                    <option value="" disabled>Scegli un animale…</option>
                    {pets.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                    ))}
                  </select>
                </label>

                <label>
                  Data inizio
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Data fine
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Ora inizio
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Ora fine
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    required
                  />
                </label>

                <button type="submit" disabled={submitting}>
                  {submitting ? 'Invio richiesta…' : 'Invia richiesta di prenotazione'}
                </button>

                {bookingError && <p className="form-error">{bookingError}</p>}
                {bookingSuccess && (
                  <p className="form-hint">
                    Richiesta inviata! Segui lo stato da <Link to="/le-mie-prenotazioni">Le mie prenotazioni</Link>.
                  </p>
                )}
              </form>
            )}
          </>
        )}
      </section>

      <section className="reviews-section">
        <h2>Recensioni</h2>
        {reviews.length === 0 ? (
          <p className="sitter-pets">Ancora nessuna recensione per questo sitter.</p>
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
