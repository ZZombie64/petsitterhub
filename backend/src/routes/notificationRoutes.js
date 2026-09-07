const express = require('express');
const { listMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationsController');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/mie', listMyNotifications);
router.put('/segna-tutte-lette', markAllAsRead);
router.put('/:id/letta', markAsRead);

module.exports = router;
