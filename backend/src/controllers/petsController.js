const pool = require('../db/pool');

/**
 * GET /api/pets/me
 * Lista degli animali del proprietario autenticato.
 */
async function listMyPets(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, species, size, notes
       FROM pets
       WHERE owner_id = $1
       ORDER BY id`,
      [req.user.id]
    );

    return res.status(200).json({ pets: result.rows });
  } catch (err) {
    console.error('Errore nel recupero degli animali:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * POST /api/pets
 * Aggiunge un nuovo animale al proprietario autenticato.
 */
async function addPet(req, res) {
  const { name, species, size, notes } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO pets (owner_id, name, species, size, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, species, size, notes`,
      [req.user.id, name, species, size || null, notes || null]
    );

    return res.status(201).json({ pet: result.rows[0] });
  } catch (err) {
    console.error('Errore nella creazione dell\'animale:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * PUT /api/pets/:id
 * Modifica un animale, solo se appartiene al proprietario autenticato.
 */
async function updatePet(req, res) {
  const { id } = req.params;
  const { name, species, size, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE pets
       SET name = $1, species = $2, size = $3, notes = $4
       WHERE id = $5 AND owner_id = $6
       RETURNING id, name, species, size, notes`,
      [name, species, size || null, notes || null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Animale non trovato.' });
    }

    return res.status(200).json({ pet: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'aggiornamento dell\'animale:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * DELETE /api/pets/:id
 * Rimuove un animale, solo se appartiene al proprietario autenticato.
 * Se l'animale ha già prenotazioni collegate, il database rifiuta la
 * cancellazione (bookings.pet_id ha ON DELETE RESTRICT): lo intercettiamo
 * per restituire un messaggio comprensibile invece di un errore generico.
 */
async function deletePet(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM pets WHERE id = $1 AND owner_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Animale non trovato.' });
    }

    return res.status(204).send();
  } catch (err) {
    if (err.code === '23503') {
      // foreign_key_violation: l'animale ha prenotazioni collegate
      return res.status(409).json({
        error: 'Questo animale ha prenotazioni collegate e non può essere rimosso.',
      });
    }
    console.error('Errore nella rimozione dell\'animale:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = { listMyPets, addPet, updatePet, deletePet };
