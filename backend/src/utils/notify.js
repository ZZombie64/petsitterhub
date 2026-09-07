const pool = require('../db/pool');

/**
 * Crea una notifica in-app per un utente. Va richiamata dai controller
 * nel momento in cui succede l'evento rilevante (nuova richiesta,
 * accettazione, messaggio, verifica admin, pagamento, ecc.).
 */
async function createNotification(userId, type, content) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, content) VALUES ($1, $2, $3)`,
      [userId, type, content]
    );
  } catch (err) {
    console.error('Errore nella creazione della notifica:', err.message);
  }
}

module.exports = { createNotification };
