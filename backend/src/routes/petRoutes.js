const express = require('express');
const { listMyPets, addPet, updatePet, deletePet } = require('../controllers/petsController');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { petValidation } = require('../middleware/validatePet');

const router = express.Router();

// Solo i proprietari gestiscono i propri animali.
router.use(authenticate, requireRole('owner'));

router.get('/me', listMyPets);
router.post('/', petValidation, addPet);
router.put('/:id', petValidation, updatePet);
router.delete('/:id', deletePet);

module.exports = router;
