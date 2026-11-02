const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { config } = require('../config.js');

const isConfigured = Boolean(config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET);
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
}

class ImageService {
  // Lægger billedet på Cloudinarys CDN og returnerer URL'en.
  // Så deler alle app-instanser de samme billeder, og de serveres tæt på brugeren.
  static upload(file) {
    if (!isConfigured) {
      return ImageService.saveLocally(file);
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'hittegods' }, (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      });
      stream.end(file.buffer);
    });
  }

  // Uden Cloudinary gemmes billedet på serverens egen disk. Det virker lokalt, men hvis appen
  // kører på flere servere bag en load balancer, kan de andre servere ikke se billedet.
  static async saveLocally(file) {
    const extension = (file.mimetype.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
    const fileName = crypto.randomBytes(12).toString('hex') + '.' + extension;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), file.buffer);
    console.log(`[Cloudinary er ikke sat op] billede gemt lokalt som /uploads/${fileName}`);
    return '/uploads/' + fileName;
  }
}

module.exports = { ImageService };
