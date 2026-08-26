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

const updateProfileValidation = [
  body('bio')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 }).withMessage('La bio è troppo lunga.'),
  body('accepted_pets')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage('Il campo "animali accettati" è troppo lungo.'),
  checkValidation,
];

const serviceValidation = [
  body('type')
    .trim()
    .notEmpty().withMessage('Il tipo di servizio è obbligatorio.')
    .isLength({ max: 50 }).withMessage('Il tipo di servizio è troppo lungo.'),
  body('price')
    .isFloat({ min: 0 }).withMessage('Il prezzo deve essere un numero positivo.'),
  body('unit')
    .optional({ checkFalsy: true })
    .isLength({ max: 20 }).withMessage('L\'unità è troppo lunga.'),
  checkValidation,
];

const availabilityValidation = [
  body('day')
    .isISO8601().withMessage('La data non è valida (formato atteso: AAAA-MM-GG).'),
  body('start_time')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Orario di inizio non valido (formato HH:MM).'),
  body('end_time')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Orario di fine non valido (formato HH:MM).'),
  checkValidation,
];

module.exports = { updateProfileValidation, serviceValidation, availabilityValidation };
