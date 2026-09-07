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

const messageValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Il messaggio non può essere vuoto.')
    .isLength({ max: 2000 }).withMessage('Il messaggio è troppo lungo.'),
  checkValidation,
];

module.exports = { messageValidation };
