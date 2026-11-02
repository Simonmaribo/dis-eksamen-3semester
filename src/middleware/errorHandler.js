const multer = require('multer');

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: 'Billedet er for stort (maks 5 MB).' });
    return;
  }

  console.error('Uventet fejl:', err.stack);
  res.status(500).json({ error: 'Der opstod en fejl. Prøv venligst igen.' });
}

module.exports = { errorHandler };
