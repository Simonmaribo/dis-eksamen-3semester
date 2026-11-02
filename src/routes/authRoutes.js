const { Router } = require('express');
const { AuthController } = require('../controllers/AuthController.js');
const { requireLogin } = require('../middleware/authMiddleware.js');
const { loginLimiter } = require('../middleware/rateLimits.js');

const router = Router();

router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireLogin, AuthController.me);

module.exports = router;
