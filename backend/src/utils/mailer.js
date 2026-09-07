const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Invia un'email. Non blocca mai il flusso principale: se l'invio
 * fallisce, logga l'errore ma non lo propaga (una prenotazione o un
 * pagamento non devono fallire per colpa di un'email non partita).
 */
async function sendMail({ to, subject, text }) {
  try {
    await transporter.sendMail({
      from: `"PetSitterHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('Errore nell\'invio dell\'email:', err.message);
  }
}

module.exports = { sendMail };
