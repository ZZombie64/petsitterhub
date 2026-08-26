const pool = require('../db/pool');

/**
 * Recupera l'id del profilo sitter (sitter_profiles.id) a partire
 * dall'id utente autenticato. Ritorna null se l'utente non ha
 * ancora un profilo sitter (non dovrebbe succedere per role='sitter',
 * ma controlliamo comunque per sicurezza).
 */
async function getSitterProfileId(userId) {
  const result = await pool.query(
    'SELECT id FROM sitter_profiles WHERE user_id = $1',
    [userId]
  );
  return result.rows[0]?.id || null;
}

/**
 * GET /api/sitters/me
 * Restituisce il profilo sitter dell'utente autenticato, con
 * servizi offerti e disponibilità (incluse quelle già prenotate,
 * a differenza del catalogo pubblico: qui il sitter deve vedere tutto).
 */
async function getMyProfile(req, res) {
  try {
    const profileResult = await pool.query(
      `SELECT sp.id AS sitter_id, sp.bio, sp.accepted_pets, sp.verification_status,
              u.full_name, u.city, u.email, u.phone
       FROM sitter_profiles sp
       JOIN users u ON u.id = sp.user_id
       WHERE sp.user_id = $1`,
      [req.user.id]
    );

    const profile = profileResult.rows[0];

    if (!profile) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const servicesResult = await pool.query(
      'SELECT id, type, price, unit FROM services WHERE sitter_id = $1 ORDER BY id',
      [profile.sitter_id]
    );

    const availabilityResult = await pool.query(
      `SELECT id, day, start_time, end_time, is_booked
       FROM availability
       WHERE sitter_id = $1
       ORDER BY day, start_time`,
      [profile.sitter_id]
    );

    return res.status(200).json({
      sitter: {
        ...profile,
        services: servicesResult.rows,
        availability: availabilityResult.rows,
      },
    });
  } catch (err) {
    console.error('Errore nel recupero del profilo sitter:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/sitters/me
 * Aggiorna bio e animali accettati del profilo sitter.
 */
async function updateMyProfile(req, res) {
  const { bio, accepted_pets } = req.body;

  try {
    const result = await pool.query(
      `UPDATE sitter_profiles
       SET bio = $1, accepted_pets = $2
       WHERE user_id = $3
       RETURNING id AS sitter_id, bio, accepted_pets, verification_status`,
      [bio || null, accepted_pets || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    return res.status(200).json({ sitter: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'aggiornamento del profilo sitter:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * POST /api/sitters/me/services
 * Aggiunge un nuovo servizio offerto dal sitter.
 */
async function addService(req, res) {
  const { type, price, unit } = req.body;

  try {
    const sitterId = await getSitterProfileId(req.user.id);
    if (!sitterId) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const result = await pool.query(
      `INSERT INTO services (sitter_id, type, price, unit)
       VALUES ($1, $2, $3, $4)
       RETURNING id, type, price, unit`,
      [sitterId, type, price, unit || 'ora']
    );

    return res.status(201).json({ service: result.rows[0] });
  } catch (err) {
    console.error('Errore nella creazione del servizio:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * DELETE /api/sitters/me/services/:id
 * Rimuove un servizio, solo se appartiene al sitter autenticato.
 */
async function deleteService(req, res) {
  const { id } = req.params;

  try {
    const sitterId = await getSitterProfileId(req.user.id);
    if (!sitterId) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const result = await pool.query(
      'DELETE FROM services WHERE id = $1 AND sitter_id = $2 RETURNING id',
      [id, sitterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servizio non trovato.' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Errore nella rimozione del servizio:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * POST /api/sitters/me/availability
 * Aggiunge una fascia di disponibilità al calendario del sitter.
 */
async function addAvailability(req, res) {
  const { day, start_time, end_time } = req.body;

  try {
    const sitterId = await getSitterProfileId(req.user.id);
    if (!sitterId) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    if (start_time >= end_time) {
      return res.status(400).json({
        error: 'L\'orario di fine deve essere successivo a quello di inizio.',
      });
    }

    const result = await pool.query(
      `INSERT INTO availability (sitter_id, day, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING id, day, start_time, end_time, is_booked`,
      [sitterId, day, start_time, end_time]
    );

    return res.status(201).json({ availability: result.rows[0] });
  } catch (err) {
    console.error('Errore nella creazione della disponibilità:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * DELETE /api/sitters/me/availability/:id
 * Rimuove una fascia di disponibilità, ma solo se non è già stata
 * prenotata da un proprietario (altrimenti si romperebbe la prenotazione).
 */
async function deleteAvailability(req, res) {
  const { id } = req.params;

  try {
    const sitterId = await getSitterProfileId(req.user.id);
    if (!sitterId) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const slotResult = await pool.query(
      'SELECT is_booked FROM availability WHERE id = $1 AND sitter_id = $2',
      [id, sitterId]
    );

    const slot = slotResult.rows[0];

    if (!slot) {
      return res.status(404).json({ error: 'Fascia oraria non trovata.' });
    }

    if (slot.is_booked) {
      return res.status(409).json({
        error: 'Questa fascia è già stata prenotata e non può essere rimossa.',
      });
    }

    await pool.query('DELETE FROM availability WHERE id = $1', [id]);

    return res.status(204).send();
  } catch (err) {
    console.error('Errore nella rimozione della disponibilità:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  addService,
  deleteService,
  addAvailability,
  deleteAvailability,
};
