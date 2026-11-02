const dotenv = require('dotenv');
dotenv.config();

const config = {
  PORT: parseInt(process.env.PORT) || 3000,
  PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:3000',
  SESSION_SECRET: process.env.SESSION_SECRET || 'skift-mig',

  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT) || 3306,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  MAIL_FROM: process.env.MAIL_FROM || 'Hotel Kastanje <hittegods@example.com>',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

module.exports = { config };
