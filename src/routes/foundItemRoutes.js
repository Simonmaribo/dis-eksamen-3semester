const { Router } = require('express');
const multer = require('multer');
const { FoundItemController } = require('../controllers/FoundItemController.js');

const router = Router();

// Billedet holdes i hukommelsen og sendes direkte videre til Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

router.get('/', FoundItemController.listFoundItems);
router.post('/', upload.single('image'), FoundItemController.createFoundItem);
router.post('/:id/match', FoundItemController.matchFoundItem);

module.exports = router;
