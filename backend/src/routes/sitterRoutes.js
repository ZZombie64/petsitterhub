const express = require('express');
const { listSitters, getSitterDetail } = require('../controllers/sittersController');
const { listSitterReviews } = require('../controllers/reviewsController');
const { uploadPhoto, uploadPlacePhoto } = require('../controllers/uploadController');
const upload = require('../middleware/upload');
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

// Caricamento foto del sitter (di sé e dell'ambiente)
router.post('/me/foto', authenticate, requireRole('sitter'), upload.single('foto'), uploadPhoto);
router.post('/me/foto-ambiente', authenticate, requireRole('sitter'), upload.single('foto'), uploadPlacePhoto);

// ------------------------------------------------------------------
// Catalogo pubblico: nessun middleware di autenticazione,
// chiunque può cercare e vedere i sitter verificati.
// ------------------------------------------------------------------
router.get('/', listSitters);
router.get('/:id', getSitterDetail);
router.get('/:id/recensioni', listSitterReviews);

module.exports = router;
