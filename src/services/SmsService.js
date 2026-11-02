const twilio = require('twilio');
const { config } = require('../config.js');

const isConfigured = Boolean(config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN && config.TWILIO_PHONE_NUMBER);
const client = isConfigured ? twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN) : null;

class SmsService {
  // Sender en SMS via Twilios REST API (HTTPS-kald fra vores server til Twilio)
  static async send(to, body) {
    if (!isConfigured) {
      console.log(`[SMS ikke sendt, Twilio er ikke sat op] til ${to}: ${body}`);
      return null;
    }

    const message = await client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
    console.log(`SMS sendt til ${to} (${message.sid})`);
    return message.sid;
  }

  // Tjekker X-Twilio-Signature: en HMAC-SHA1 af URL + parametre med vores auth token som nøgle.
  // Kun Twilio kender nøglen, så en falsk request fra andre bliver afvist.
  static isValidWebhook(signature, url, params) {
    if (!config.TWILIO_AUTH_TOKEN) return true;
    return twilio.validateRequest(config.TWILIO_AUTH_TOKEN, signature || '', url, params);
  }

  // Svaret på et webhook er TwiML (XML), som Twilio sender videre som SMS
  static replyXml(text) {
    const response = new twilio.twiml.MessagingResponse();
    response.message(text);
    return response.toString();
  }
}

module.exports = { SmsService };
