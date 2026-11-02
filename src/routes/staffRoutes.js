const { Router } = require('express');
const { StaffController } = require('../controllers/StaffController.js');
const { requireAdmin } = require('../middleware/authMiddleware.js');

const router = Router();

router.get('/', requireAdmin, StaffController.listStaff);
router.post('/', requireAdmin, StaffController.createStaff);

module.exports = router;
