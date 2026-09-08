// Middleware che riceve i file caricati e li tiene in memoria (non su disco),
// pronti per essere spediti a Cloudinary.
// Accetta solo immagini, massimo 5 MB.

const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sono ammesse solo immagini.'));
    }
  },
});

module.exports = upload;
