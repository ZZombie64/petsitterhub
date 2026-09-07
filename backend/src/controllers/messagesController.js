const pool = require('../db/pool');
const { createNotification } = require('../utils/notify');

/**
 * Verifica che l'utente autenticato sia parte della prenotazione
 * (il proprietario che l'ha fatta, o il sitter a cui è rivolta).
 * Ritorna la prenotazione se autorizzato, altrimenti null.
 */
async function getAuthorizedBooking(bookingId, userId) {
  const result = await pool.query(
    `SELECT b.id, b.owner_id, sp.user_id AS sitter_user_id
     FROM bookings b
     JOIN sitter_profiles sp ON sp.id = b.sitter_id
     WHERE b.id = $1`,
    [bookingId]
  );

  const booking = result.rows[0];
  if (!booking) return null;
  if (booking.owner_id !== userId && booking.sitter_user_id !== userId) return null;

  return booking;
}

/**
 * GET /api/bookings/:id/messaggi
 * Cronologia messaggi di una prenotazione, visibile solo alle due
 * parti coinvolte (proprietario e sitter).
 */
async function listMessages(req, res) {
  const { id } = req.params;

  try {
    const booking = await getAuthorizedBooking(id, req.user.id);
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata.' });
    }

    const result = await pool.query(
      `SELECT id, sender_id, content, sent_at
       FROM messages
       WHERE booking_id = $1
       ORDER BY sent_at ASC`,
      [id]
    );

    return res.status(200).json({ messages: result.rows });
  } catch (err) {
    console.error('Errore nel recupero dei messaggi:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * POST /api/bookings/:id/messaggi
 * Invia un messaggio legato a una prenotazione.
 */
async function sendMessage(req, res) {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const booking = await getAuthorizedBooking(id, req.user.id);
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata.' });
    }

    const result = await pool.query(
      `INSERT INTO messages (booking_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, content, sent_at`,
      [id, req.user.id, content]
    );

    const recipientId = req.user.id === booking.owner_id ? booking.sitter_user_id : booking.owner_id;
    await createNotification(
      recipientId,
      'nuovo_messaggio',
      `Hai un nuovo messaggio nella prenotazione #${id}.`
    );

    return res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'invio del messaggio:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = { listMessages, sendMessage };
