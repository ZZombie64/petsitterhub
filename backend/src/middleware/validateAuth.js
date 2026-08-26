const { body, validationResult } = require('express-validator');

/**
 * Se express-validator ha trovato errori nei campi precedenti,
 * interrompe la richiesta e li restituisce in modo leggibile.
 */
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

const registerValidation = [
  body('email')
    .isEmail().withMessage('Inserisci un indirizzo email valido.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La password deve avere almeno 8 caratteri.'),
  body('full_name')
    .trim()
    .notEmpty().withMessage('Il nome completo è obbligatorio.')
    .isLength({ max: 150 }).withMessage('Il nome è troppo lungo.'),
  body('role')
    .optional()
    .isIn(['owner', 'sitter']).withMessage('Ruolo non valido.'),
  body('phone')
    .optional({ checkFalsy: true })
    .isLength({ max: 30 }).withMessage('Numero di telefono troppo lungo.'),
  checkValidation,
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('Inserisci un indirizzo email valido.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La password è obbligatoria.'),
  checkValidation,
];

module.exports = { registerValidation, loginValidation };
