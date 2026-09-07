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

const petValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Il nome dell\'animale è obbligatorio.')
    .isLength({ max: 100 }).withMessage('Il nome è troppo lungo.'),
  body('species')
    .trim()
    .notEmpty().withMessage('La specie è obbligatoria (es. cane, gatto).')
    .isLength({ max: 50 }).withMessage('La specie è troppo lunga.'),
  body('size')
    .optional({ checkFalsy: true })
    .isLength({ max: 20 }).withMessage('La taglia è troppo lunga.'),
  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 }).withMessage('Le note sono troppo lunghe.'),
  checkValidation,
];

module.exports = { petValidation };
