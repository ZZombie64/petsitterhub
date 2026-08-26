const express = require('express');
const { listSitters, getSitterDetail } = require('../controllers/sittersController');
const {
  getMyProfile,
  updateMyProfile,
  addService,
  deleteService,
  addAvailability,
  deleteAvailability,
} = require('../controllers/sitterProfileController');
const { authenticate, requireRole } = require('../middleware/authenticate');
const {
  updateProfileValidation,
  serviceValidation,
  availabilityValidation,
} = require('../middleware/validateSitterProfile');

const router = express.Router();

// ------------------------------------------------------------------
// Rotte private: il sitter gestisce il proprio profilo.
// Vanno dichiarate PRIMA di "/:id", altrimenti Express interpreterebbe
// "me" come se fosse un id di sitter.
// ------------------------------------------------------------------
router.get('/me', authenticate, requireRole('sitter'), getMyProfile);
router.put('/me', authenticate, requireRole('sitter'), updateProfileValidation, updateMyProfile);

router.post('/me/services', authenticate, requireRole('sitter'), serviceValidation, addService);
router.delete('/me/services/:id', authenticate, requireRole('sitter'), deleteService);

router.post('/me/availability', authenticate, requireRole('sitter'), availabilityValidation, addAvailability);
router.delete('/me/availability/:id', authenticate, requireRole('sitter'), deleteAvailability);

// ------------------------------------------------------------------
// Catalogo pubblico: nessun middleware di autenticazione,
// chiunque può cercare e vedere i sitter verificati.
// ------------------------------------------------------------------
router.get('/', listSitters);
router.get('/:id', getSitterDetail);

module.exports = router;
