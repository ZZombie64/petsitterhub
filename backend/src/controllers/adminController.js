const pool = require('../db/pool');
const { createNotification } = require('../utils/notify');

/**
 * GET /api/admin/sitters?status=in_attesa
 * Lista dei profili sitter per la verifica amministrativa.
 * Senza filtro "status" restituisce tutti i profili.
 */
async function listSitters(req, res) {
  const { status } = req.query;

  try {
    const result = await pool.query(
      `SELECT sp.id AS sitter_id, sp.bio, sp.accepted_pets, sp.verification_status, sp.created_at,
              u.id AS user_id, u.full_name, u.email, u.city, u.phone
       FROM sitter_profiles sp
       JOIN users u ON u.id = sp.user_id
       WHERE ($1::text IS NULL OR sp.verification_status = $1)
       ORDER BY sp.created_at DESC`,
      [status || null]
    );

    return res.status(200).json({ sitters: result.rows });
  } catch (err) {
    console.error('Errore nel recupero dei sitter (admin):', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/admin/sitters/:id/verifica
 * Approva o rifiuta un profilo sitter.
 */
async function updateSitterVerification(req, res) {
  const { id } = req.params;
  const { verification_status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE sitter_profiles
       SET verification_status = $1
       WHERE id = $2
       RETURNING id AS sitter_id, user_id, verification_status`,
      [verification_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }

    const sitter = result.rows[0];
    const message = sitter.verification_status === 'approvato'
      ? 'Il tuo profilo è stato approvato! Ora sei visibile nel catalogo.'
      : 'Il tuo profilo è stato rifiutato dall\'amministratore.';
    await createNotification(sitter.user_id, 'verifica_sitter', message);

    return res.status(200).json({ sitter });
  } catch (err) {
    console.error('Errore nell\'aggiornamento della verifica sitter:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * GET /api/admin/disputes?status=aperta
 * Lista delle dispute per la gestione amministrativa.
 */
async function listDisputes(req, res) {
  const { status } = req.query;

  try {
    const result = await pool.query(
      `SELECT d.id, d.booking_id, d.reason, d.status, d.created_at,
              u.full_name AS opened_by_name, u.email AS opened_by_email
       FROM disputes d
       JOIN users u ON u.id = d.opened_by
       WHERE ($1::text IS NULL OR d.status = $1)
       ORDER BY d.created_at DESC`,
      [status || null]
    );

    return res.status(200).json({ disputes: result.rows });
  } catch (err) {
    console.error('Errore nel recupero delle dispute:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/admin/disputes/:id
 * Aggiorna lo stato di una disputa (in_esame, risolta, respinta).
 */
async function updateDisputeStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE disputes
       SET status = $1
       WHERE id = $2
       RETURNING id, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Disputa non trovata.' });
    }

    return res.status(200).json({ dispute: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'aggiornamento della disputa:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = {
  listSitters,
  updateSitterVerification,
  listDisputes,
  updateDisputeStatus,
};
