const pool = require('../db/pool');
const { createNotification } = require('../utils/notify');

/**
 * Recupera l'id del profilo sitter (sitter_profiles.id) a partire
 * dall'id utente autenticato (stesso pattern di sitterProfileController).
 */
async function getSitterProfileId(userId) {
  const result = await pool.query(
    'SELECT id FROM sitter_profiles WHERE user_id = $1',
    [userId]
  );
  return result.rows[0]?.id || null;
}

/**
 * Calcola il numero di giorni/notti tra due date (inclusi gli estremi
 * per "giorno", escluso l'ultimo per "notte", come in un hotel).
 */
function calculateTotalPrice(price, unit, startDate, endDate, startTime, endTime) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysBetween = Math.round((end - start) / (1000 * 60 * 60 * 24));

  if (unit === 'giorno') {
    return price * Math.max(daysBetween + 1, 1);
  }
  if (unit === 'notte') {
    return price * Math.max(daysBetween, 1);
  }
  if (unit === 'ora' && startTime && endTime) {
    // Calcolo le ore effettive tra ora di inizio e fine (stesso giorno).
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const ore = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
    return price * Math.max(ore, 1);
  }
  // "servizio" o ore non indicate: prezzo fisso.
  return price;
}

/**
 * POST /api/bookings
 * Il proprietario crea una richiesta di prenotazione.
 */
async function createBooking(req, res) {
  const { sitter_id, service_id, pet_id, start_date, end_date, start_time, end_time } = req.body;

  try {
    const petResult = await pool.query(
      'SELECT id FROM pets WHERE id = $1 AND owner_id = $2',
      [pet_id, req.user.id]
    );
    if (petResult.rows.length === 0) {
      return res.status(404).json({ error: 'Animale non trovato tra i tuoi animali.' });
    }

    const sitterResult = await pool.query(
      `SELECT id, user_id FROM sitter_profiles WHERE id = $1 AND verification_status = 'approvato'`,
      [sitter_id]
    );
    if (sitterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sitter non trovato o non ancora verificato.' });
    }

    const serviceResult = await pool.query(
      'SELECT price, unit FROM services WHERE id = $1 AND sitter_id = $2',
      [service_id, sitter_id]
    );
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Servizio non trovato per questo sitter.' });
    }

    const { price, unit } = serviceResult.rows[0];
    const total_price = calculateTotalPrice(Number(price), unit, start_date, end_date, start_time, end_time);

    const result = await pool.query(
      `INSERT INTO bookings (owner_id, sitter_id, service_id, pet_id, start_date, end_date, start_time, end_time, status, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'richiesta', $9)
       RETURNING id, sitter_id, service_id, pet_id, start_date, end_date, start_time, end_time, status, total_price, created_at`,
      [req.user.id, sitter_id, service_id, pet_id, start_date, end_date, start_time, end_time, total_price]
    );

    await createNotification(
      sitterResult.rows[0].user_id,
      'nuova_richiesta',
      `Hai una nuova richiesta di prenotazione da ${req.user.email}.`
    );

    return res.status(201).json({ booking: result.rows[0] });
  } catch (err) {
    console.error('Errore nella creazione della prenotazione:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * GET /api/bookings/mie
 * Prenotazioni fatte dal proprietario autenticato.
 */
async function listMyBookings(req, res) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.status, b.start_date, b.end_date, b.start_time, b.end_time, b.total_price, b.accepted_at, b.created_at,
              u.full_name AS sitter_name,
              s.type AS service_type, s.unit,
              p.name AS pet_name
       FROM bookings b
       JOIN sitter_profiles sp ON sp.id = b.sitter_id
       JOIN users u ON u.id = sp.user_id
       JOIN services s ON s.id = b.service_id
       JOIN pets p ON p.id = b.pet_id
       WHERE b.owner_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ bookings: result.rows });
  } catch (err) {
    console.error('Errore nel recupero delle prenotazioni:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * GET /api/bookings/ricevute
 * Richieste di prenotazione ricevute dal sitter autenticato.
 */
async function listReceivedBookings(req, res) {
  try {
    const sitterId = await getSitterProfileId(req.user.id);
    if (!sitterId) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const result = await pool.query(
      `SELECT b.id, b.status, b.start_date, b.end_date, b.start_time, b.end_time, b.total_price, b.accepted_at, b.created_at,
              u.full_name AS owner_name, u.phone AS owner_phone,
              s.type AS service_type, s.unit,
              p.name AS pet_name, p.species AS pet_species
       FROM bookings b
       JOIN users u ON u.id = b.owner_id
       JOIN services s ON s.id = b.service_id
       JOIN pets p ON p.id = b.pet_id
       WHERE b.sitter_id = $1
       ORDER BY b.created_at DESC`,
      [sitterId]
    );

    return res.status(200).json({ bookings: result.rows });
  } catch (err) {
    console.error('Errore nel recupero delle richieste ricevute:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/bookings/:id/accetta
 * Il sitter accetta una richiesta: da qui in poi si può procedere al pagamento.
 * Marca come occupate le fasce di disponibilità comprese nel periodo prenotato.
 */
async function acceptBooking(req, res) {
  const { id } = req.params;

  try {
    const sitterId = await getSitterProfileId(req.user.id);
    if (!sitterId) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET status = 'accettata', accepted_at = NOW()
       WHERE id = $1 AND sitter_id = $2 AND status = 'richiesta'
       RETURNING id, owner_id, start_date, end_date, status, accepted_at`,
      [id, sitterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Richiesta non trovata o non più modificabile.',
      });
    }

    const booking = result.rows[0];

    await pool.query(
      `UPDATE availability
       SET is_booked = TRUE
       WHERE sitter_id = $1 AND day BETWEEN $2 AND $3`,
      [sitterId, booking.start_date, booking.end_date]
    );

    await createNotification(
      booking.owner_id,
      'accettata',
      `La tua richiesta di prenotazione #${booking.id} è stata accettata. Puoi procedere al pagamento.`
    );

    return res.status(200).json({ booking });
  } catch (err) {
    console.error('Errore nell\'accettazione della prenotazione:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/bookings/:id/rifiuta
 * Il sitter rifiuta una richiesta.
 */
async function rejectBooking(req, res) {
  const { id } = req.params;

  try {
    const sitterId = await getSitterProfileId(req.user.id);
    if (!sitterId) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET status = 'annullata'
       WHERE id = $1 AND sitter_id = $2 AND status = 'richiesta'
       RETURNING id, owner_id, status`,
      [id, sitterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Richiesta non trovata o non più modificabile.',
      });
    }

    await createNotification(
      result.rows[0].owner_id,
      'rifiutata',
      `La tua richiesta di prenotazione #${result.rows[0].id} è stata rifiutata dal sitter.`
    );

    return res.status(200).json({ booking: result.rows[0] });
  } catch (err) {
    console.error('Errore nel rifiuto della prenotazione:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/bookings/:id/annulla
 * Il proprietario annulla una propria richiesta, solo se il sitter
 * non ha ancora risposto (altrimenti va gestita come disputa).
 */
async function cancelBooking(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'annullata'
       WHERE id = $1 AND owner_id = $2 AND status = 'richiesta'
       RETURNING id, status`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Prenotazione non trovata o non più annullabile.',
      });
    }

    return res.status(200).json({ booking: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'annullamento della prenotazione:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

// Il proprietario segna come completata una prenotazione confermata (pagata).
// Solo dopo questo passaggio potrà lasciare una recensione.
async function completeBooking(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'completata'
       WHERE id = $1 AND owner_id = $2 AND status = 'confermata'
       RETURNING id, status`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Prenotazione non trovata o non ancora confermata.',
      });
    }

    return res.status(200).json({ booking: result.rows[0] });
  } catch (err) {
    console.error('Errore nel completamento della prenotazione:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

// Guadagni del sitter: totale incassato e dettaglio per ogni prenotazione pagata.
// Contiamo solo le prenotazioni con un pagamento andato a buon fine.
async function getMyEarnings(req, res) {
  try {
    const sitterId = await getSitterProfileId(req.user.id);
    if (!sitterId) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const result = await pool.query(
      `SELECT b.id, b.start_date, b.end_date, b.status, pay.amount, pay.paid_at,
              u.full_name AS owner_name, s.type AS service_type, pet.name AS pet_name
       FROM payments pay
       JOIN bookings b ON b.id = pay.booking_id
       JOIN users u ON u.id = b.owner_id
       JOIN services s ON s.id = b.service_id
       JOIN pets pet ON pet.id = b.pet_id
       WHERE b.sitter_id = $1 AND pay.status = 'pagato'
       ORDER BY pay.paid_at DESC`,
      [sitterId]
    );

    // Somma di tutti gli incassi
    const totale = result.rows.reduce((s, r) => s + Number(r.amount), 0);

    return res.status(200).json({
      totale: totale,
      numero: result.rows.length,
      dettaglio: result.rows,
    });
  } catch (err) {
    console.error('Errore nel recupero dei guadagni:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = {
  createBooking,
  listMyBookings,
  listReceivedBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  getMyEarnings,
};
