const { Router } = require('express');
const { WebhookController } = require('../controllers/WebhookController.js');

const router = Router();

router.post('/sms', WebhookController.incomingSms);

module.exports = router;
