const express = require('express');
const { listSitters, getSitterDetail } = require('../controllers/sittersController');

const router = express.Router();

// Catalogo pubblico: nessun middleware di autenticazione,
// chiunque può cercare e vedere i sitter verificati.
router.get('/', listSitters);
router.get('/:id', getSitterDetail);

module.exports = router;
