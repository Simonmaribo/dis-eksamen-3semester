const { Router } = require('express');
const { CaseController } = require('../controllers/CaseController.js');
const { requireLogin } = require('../middleware/authMiddleware.js');
const { reportLimiter } = require('../middleware/rateLimits.js');

const router = Router();

// Offentlige endpoints for kunden
router.post('/', reportLimiter, CaseController.createCase);
router.get('/public/:token', CaseController.showPublicCase);

// Personalet
router.get('/', requireLogin, CaseController.listCases);
router.patch('/:id/deliver', requireLogin, CaseController.deliverCase);

module.exports = router;
