const pool = require('../db/pool');

/**
 * GET /api/sitters
 * Catalogo pubblico dei sitter verificati, con filtri opzionali via query string:
 *   ?citta=Como
 *   &animale=cane        (cerca dentro sitter_profiles.accepted_pets)
 *   &servizio=passeggiata (cerca dentro services.type)
 *   &data=2026-09-10     (solo sitter con disponibilità libera in quel giorno)
 *
 * Tutti i filtri sono opzionali e combinabili tra loro.
 * Vengono mostrati SOLO i sitter con verification_status = 'approvato':
 * un profilo non ancora verificato dall'amministratore non deve
 * comparire nel catalogo pubblico.
 */
async function listSitters(req, res) {
  const { citta, animale, servizio, data } = req.query;

  // I filtri "a testo libero" usano ILIKE con wildcard per un match parziale
  // e case-insensitive (es. "como" trova anche "Como").
  const cittaParam = citta ? `%${citta}%` : null;
  const animaleParam = animale ? `%${animale}%` : null;
  const servizioParam = servizio ? `%${servizio}%` : null;
  const dataParam = data || null; // atteso in formato YYYY-MM-DD

  try {
    const result = await pool.query(
      `
      SELECT
        sp.id            AS sitter_id,
        u.full_name,
        u.city,
        sp.bio,
        sp.accepted_pets,
        COALESCE(
          (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.sitter_id = sp.id),
          0
        ) AS media_voti,
        (SELECT COUNT(*) FROM reviews r WHERE r.sitter_id = sp.id) AS numero_recensioni,
        COALESCE(
          (
            SELECT json_agg(
                     json_build_object('id', s.id, 'type', s.type, 'price', s.price, 'unit', s.unit)
                     ORDER BY s.type
                   )
            FROM services s
            WHERE s.sitter_id = sp.id
          ),
          '[]'
        ) AS services
      FROM sitter_profiles sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.verification_status = 'approvato'
        AND ($1::text IS NULL OR u.city ILIKE $1)
        AND ($2::text IS NULL OR sp.accepted_pets ILIKE $2)
        AND (
          $3::text IS NULL OR EXISTS (
            SELECT 1 FROM services s2
            WHERE s2.sitter_id = sp.id AND s2.type ILIKE $3
          )
        )
        AND (
          $4::date IS NULL OR EXISTS (
            SELECT 1 FROM availability a
            WHERE a.sitter_id = sp.id AND a.day = $4::date AND a.is_booked = FALSE
          )
        )
      ORDER BY u.full_name;
      `,
      [cittaParam, animaleParam, servizioParam, dataParam]
    );

    return res.status(200).json({ sitters: result.rows });
  } catch (err) {
    console.error('Errore nel recupero del catalogo sitter:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * GET /api/sitters/:id
 * Dettaglio di un singolo sitter: profilo, servizi offerti e
 * prossime disponibilità libere (non ancora prenotate).
 */
async function getSitterDetail(req, res) {
  const { id } = req.params;

  try {
    const sitterResult = await pool.query(
      `
      SELECT
        sp.id AS sitter_id,
        u.full_name,
        u.city,
        sp.bio,
        sp.accepted_pets,
        sp.verification_status,
        sp.photo_url,
        sp.place_photo_url,
        COALESCE(
          (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.sitter_id = sp.id),
          0
        ) AS media_voti,
        (SELECT COUNT(*) FROM reviews r WHERE r.sitter_id = sp.id) AS numero_recensioni
      FROM sitter_profiles sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.id = $1 AND sp.verification_status = 'approvato'
      `,
      [id]
    );

    const sitter = sitterResult.rows[0];

    if (!sitter) {
      return res.status(404).json({ error: 'Sitter non trovato.' });
    }

    const servicesResult = await pool.query(
      'SELECT id, type, price, unit FROM services WHERE sitter_id = $1 ORDER BY type',
      [id]
    );

    const availabilityResult = await pool.query(
      `SELECT id, day, start_time, end_time
       FROM availability
       WHERE sitter_id = $1 AND is_booked = FALSE AND day >= CURRENT_DATE
       ORDER BY day, start_time`,
      [id]
    );

    return res.status(200).json({
      sitter: {
        ...sitter,
        services: servicesResult.rows,
        availability: availabilityResult.rows,
      },
    });
  } catch (err) {
    console.error('Errore nel recupero del dettaglio sitter:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = { listSitters, getSitterDetail };
