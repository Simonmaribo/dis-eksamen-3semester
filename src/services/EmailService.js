const nodemailer = require('nodemailer');
const { config } = require('../config.js');

const isConfigured = Boolean(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASSWORD);

// Nodemailer afleverer mailen til en SMTP-server, som sender den videre til modtagerens mailserver (MX-record)
const transporter = isConfigured
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
    })
  : null;

class EmailService {
  static async send(to, subject, text) {
    if (!isConfigured) {
      console.log(`[Mail ikke sendt, SMTP er ikke sat op] til ${to}: ${subject}\n${text}`);
      return null;
    }

    const info = await transporter.sendMail({ from: config.MAIL_FROM, to, subject, text });
    console.log(`Mail sendt til ${to} (${info.messageId})`);
    return info.messageId;
  }
}

module.exports = { EmailService };
