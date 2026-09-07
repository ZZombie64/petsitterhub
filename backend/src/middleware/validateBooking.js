const { body, validationResult } = require('express-validator');

function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dati non validi.',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

const createBookingValidation = [
  body('sitter_id').isInt({ min: 1 }).withMessage('Sitter non valido.'),
  body('service_id').isInt({ min: 1 }).withMessage('Servizio non valido.'),
  body('pet_id').isInt({ min: 1 }).withMessage('Animale non valido.'),
  body('start_date')
    .isISO8601().withMessage('Data di inizio non valida (formato AAAA-MM-GG).'),
  body('end_date')
    .isISO8601().withMessage('Data di fine non valida (formato AAAA-MM-GG).')
    .custom((end_date, { req }) => end_date >= req.body.start_date)
    .withMessage('La data di fine deve essere uguale o successiva a quella di inizio.'),
  checkValidation,
];

module.exports = { createBookingValidation };
