const pool = require('../db/pool');

// Il proprietario lascia una recensione per una prenotazione COMPLETATA.
// Regole: dev'essere una sua prenotazione, completata, e non ancora recensita.
async function createReview(req, res) {
  const { id } = req.params;          // id della prenotazione
  const { rating, comment } = req.body;

  // Controllo che il voto sia valido (1-5)
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Il voto deve essere tra 1 e 5.' });
  }

  try {
    // Recupero la prenotazione e verifico che sia dell'utente e completata
    const bookingResult = await pool.query(
      `SELECT id, sitter_id, status FROM bookings
       WHERE id = $1 AND owner_id = $2`,
      [id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prenotazione non trovata.' });
    }

    const booking = bookingResult.rows[0];
    if (booking.status !== 'completata') {
      return res.status(400).json({ error: 'Puoi recensire solo un servizio completato.' });
    }

    // Provo a inserire. Il vincolo UNIQUE su booking_id impedisce doppie recensioni.
    const result = await pool.query(
      `INSERT INTO reviews (booking_id, owner_id, sitter_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, rating, comment, created_at`,
      [booking.id, req.user.id, booking.sitter_id, rating, comment || null]
    );

    return res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    // Se esiste già una recensione per questa prenotazione
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Hai già recensito questa prenotazione.' });
    }
    console.error('Errore nella creazione della recensione:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

// Elenco delle recensioni di un sitter, con il nome di chi le ha scritte.
async function listSitterReviews(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.full_name AS autore
       FROM reviews r
       JOIN users u ON u.id = r.owner_id
       WHERE r.sitter_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );
    return res.status(200).json({ reviews: result.rows });
  } catch (err) {
    console.error('Errore nel recupero delle recensioni:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = {
  createReview,
  listSitterReviews,
};
