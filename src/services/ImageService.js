const cloudinary = require('cloudinary').v2;
const { config } = require('../config.js');

const isConfigured = Boolean(config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET);

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
  static upload(buffer) {
    if (!isConfigured) {
      console.log('[Billede ikke gemt, Cloudinary er ikke sat op]');
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'hittegods' }, (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      });
      stream.end(buffer);
    });
  }
}

module.exports = { ImageService };
