const express = require('express');
const {
  createBooking,
  listMyBookings,
  listReceivedBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
} = require('../controllers/bookingsController');
const { listMessages, sendMessage } = require('../controllers/messagesController');
const { createPaymentSession, confirmPayment } = require('../controllers/paymentsController');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { createBookingValidation } = require('../middleware/validateBooking');
const { messageValidation } = require('../middleware/validateMessage');

const router = express.Router();

router.use(authenticate);

// Lato proprietario
router.post('/', requireRole('owner'), createBookingValidation, createBooking);
router.get('/mie', requireRole('owner'), listMyBookings);
router.put('/:id/annulla', requireRole('owner'), cancelBooking);
router.post('/:id/pagamento', requireRole('owner'), createPaymentSession);
router.get('/:id/pagamento/conferma', requireRole('owner'), confirmPayment);

// Lato sitter
router.get('/ricevute', requireRole('sitter'), listReceivedBookings);
router.put('/:id/accetta', requireRole('sitter'), acceptBooking);
router.put('/:id/rifiuta', requireRole('sitter'), rejectBooking);

// Messaggistica: accessibile a entrambe le parti coinvolte nella prenotazione
// (il controller verifica che l'utente sia il proprietario o il sitter).
router.get('/:id/messaggi', listMessages);
router.post('/:id/messaggi', messageValidation, sendMessage);

module.exports = router;
