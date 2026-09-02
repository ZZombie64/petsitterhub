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

const sitterVerificationValidation = [
  body('verification_status')
    .isIn(['approvato', 'rifiutato']).withMessage('Stato non valido (usa "approvato" o "rifiutato").'),
  checkValidation,
];

const disputeStatusValidation = [
  body('status')
    .isIn(['in_esame', 'risolta', 'respinta']).withMessage('Stato non valido.'),
  checkValidation,
];

module.exports = { sitterVerificationValidation, disputeStatusValidation };
