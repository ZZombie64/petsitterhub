const express = require('express');
const {
  listSitters,
  updateSitterVerification,
  listDisputes,
  updateDisputeStatus,
} = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/authenticate');
const {
  sitterVerificationValidation,
  disputeStatusValidation,
} = require('../middleware/validateAdmin');

const router = express.Router();

// Tutte le rotte admin richiedono un utente autenticato con ruolo 'admin'.
router.use(authenticate, requireRole('admin'));

router.get('/sitters', listSitters);
router.put('/sitters/:id/verifica', sitterVerificationValidation, updateSitterVerification);

router.get('/disputes', listDisputes);
router.put('/disputes/:id', disputeStatusValidation, updateDisputeStatus);

module.exports = router;
