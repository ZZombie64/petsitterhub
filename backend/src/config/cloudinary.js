// Configurazione di Cloudinary, il servizio dove salviamo le immagini.
// Le chiavi arrivano dal file .env (non vanno mai scritte qui nel codice).

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
