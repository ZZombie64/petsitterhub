const pool = require('../db/pool');

/**
 * GET /api/notifications/mie
 * Notifiche dell'utente autenticato, più recenti prima.
 */
async function listMyNotifications(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, type, content, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    return res.status(200).json({ notifications: result.rows });
  } catch (err) {
    console.error('Errore nel recupero delle notifiche:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/notifications/:id/letta
 * Segna una singola notifica come letta.
 */
async function markAsRead(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notifica non trovata.' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Errore nell\'aggiornamento della notifica:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/notifications/segna-tutte-lette
 * Segna tutte le notifiche dell'utente come lette.
 */
async function markAllAsRead(req, res) {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    return res.status(204).send();
  } catch (err) {
    console.error('Errore nell\'aggiornamento delle notifiche:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = { listMyNotifications, markAsRead, markAllAsRead };
