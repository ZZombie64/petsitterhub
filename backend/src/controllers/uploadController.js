// Gestisce il caricamento delle foto del sitter su Cloudinary.
// Il sitter invia un'immagine, la mandiamo a Cloudinary, otteniamo un link
// e lo salviamo nel suo profilo.

const cloudinary = require('../config/cloudinary');
const pool = require('../db/pool');

// Carica un'immagine su Cloudinary partendo dai dati grezzi del file.
// Restituisce il link (URL) dell'immagine salvata.
function caricaSuCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'petsitterhub' },   // le immagini finiscono in una cartella dedicata
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Foto del sitter (di se stesso). Campo del profilo: photo_url
async function uploadPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nessun file inviato.' });
  }
  try {
    const url = await caricaSuCloudinary(req.file.buffer);
    const result = await pool.query(
      `UPDATE sitter_profiles SET photo_url = $1 WHERE user_id = $2
       RETURNING photo_url`,
      [url, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }
    return res.status(200).json({ photo_url: result.rows[0].photo_url });
  } catch (err) {
    console.error('Errore upload foto sitter:', err);
    return res.status(500).json({ error: 'Errore durante il caricamento.' });
  }
}

// Foto dell'ambiente. Campo del profilo: place_photo_url
async function uploadPlacePhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nessun file inviato.' });
  }
  try {
    const url = await caricaSuCloudinary(req.file.buffer);
    const result = await pool.query(
      `UPDATE sitter_profiles SET place_photo_url = $1 WHERE user_id = $2
       RETURNING place_photo_url`,
      [url, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profilo sitter non trovato.' });
    }
    return res.status(200).json({ place_photo_url: result.rows[0].place_photo_url });
  } catch (err) {
    console.error('Errore upload foto ambiente:', err);
    return res.status(500).json({ error: 'Errore durante il caricamento.' });
  }
}

module.exports = { uploadPhoto, uploadPlacePhoto };
