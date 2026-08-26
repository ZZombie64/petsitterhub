const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validateAuth');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, me);

module.exports = router;
