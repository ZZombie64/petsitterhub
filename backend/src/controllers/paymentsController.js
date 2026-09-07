const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db/pool');
const { createNotification } = require('../utils/notify');
const { sendMail } = require('../utils/mailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * POST /api/bookings/:id/pagamento
 * Crea una sessione di pagamento Stripe (modalità test) per una
 * prenotazione già accettata dal sitter. Solo da qui in poi il
 * proprietario può pagare, come richiesto dalla traccia ("conferma
 * solo a servizio accettato").
 */
async function createPaymentSession(req, res) {
  const { id } = req.params;

  try {
    const bookingResult = await pool.query(
      `SELECT b.id, b.status, b.total_price, s.type AS service_type
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.id = $1 AND b.owner_id = $2`,
      [id, req.user.id]
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata.' });
    }

    if (booking.status !== 'accettata') {
      return res.status(409).json({
        error: 'Puoi pagare solo una prenotazione già accettata dal sitter.',
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Prenotazione #${booking.id} — ${booking.service_type}` },
            unit_amount: Math.round(Number(booking.total_price) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/le-mie-prenotazioni?pagamento=successo&session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${FRONTEND_URL}/le-mie-prenotazioni?pagamento=annullato`,
    });

    await pool.query(
      `INSERT INTO payments (booking_id, amount, status, provider_ref)
       VALUES ($1, $2, 'in_attesa', $3)
       ON CONFLICT (booking_id)
       DO UPDATE SET provider_ref = EXCLUDED.provider_ref, status = 'in_attesa'`,
      [booking.id, booking.total_price, session.id]
    );

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Errore nella creazione della sessione di pagamento:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

/**
 * GET /api/bookings/:id/pagamento/conferma?session_id=...
 * Dopo il redirect da Stripe, verifica direttamente con Stripe che il
 * pagamento sia andato a buon fine prima di confermare la prenotazione.
 */
async function confirmPayment(req, res) {
  const { id } = req.params;
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'session_id mancante.' });
  }

  try {
    const bookingResult = await pool.query(
      `SELECT b.id, b.status, b.total_price, u.email AS owner_email, u.full_name AS owner_name,
              s.type AS service_type
       FROM bookings b
       JOIN users u ON u.id = b.owner_id
       JOIN services s ON s.id = b.service_id
       WHERE b.id = $1 AND b.owner_id = $2`,
      [id, req.user.id]
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata.' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Il pagamento non risulta ancora confermato da Stripe.' });
    }

    await pool.query(
      `UPDATE payments SET status = 'pagato', paid_at = NOW() WHERE booking_id = $1`,
      [id]
    );

    // La condizione "status != 'confermata'" evita di rimandare notifica ed
    // email se l'utente ricarica la pagina di successo più volte.
    const result = await pool.query(
      `UPDATE bookings SET status = 'confermata' WHERE id = $1 AND status != 'confermata' RETURNING id, status`,
      [id]
    );

    if (result.rows.length > 0) {
      await createNotification(
        req.user.id,
        'pagamento_confermato',
        `Il pagamento per la prenotazione #${booking.id} (${booking.service_type}) è andato a buon fine.`
      );

      await sendMail({
        to: booking.owner_email,
        subject: `PetSitterHub — Conferma pagamento prenotazione #${booking.id}`,
        text: `Ciao ${booking.owner_name},\n\nIl pagamento di ${Number(booking.total_price).toFixed(2)} € per la prenotazione #${booking.id} (${booking.service_type}) è stato confermato.\n\nGrazie per aver usato PetSitterHub!`,
      });
    }

    return res.status(200).json({ booking: { id: booking.id, status: 'confermata' } });
  } catch (err) {
    console.error('Errore nella conferma del pagamento:', err);
    return res.status(500).json({ error: 'Errore interno del server.' });
  }
}

module.exports = { createPaymentSession, confirmPayment };
