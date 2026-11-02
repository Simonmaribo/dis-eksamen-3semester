const { config } = require('../config.js');
const { LostCase } = require('../models/LostCase.js');
const { SmsService } = require('../services/SmsService.js');
const { NotificationService } = require('../services/NotificationService.js');
const { cleanText } = require('../middleware/validation.js');

class WebhookController {
  // Twilio kalder dette endpoint med en HTTP POST, når nogen sender en SMS til hotellets nummer.
  // Body er form-encoded med bl.a. From, Body og MessageSid.
  static async incomingSms(req, res, next) {
    try {
      const url = config.PUBLIC_URL + req.originalUrl;
      if (!SmsService.isValidWebhook(req.get('X-Twilio-Signature'), url, req.body)) {
        res.status(403).send('Ugyldig signatur');
        return;
      }

      const phone = req.body.From;
      const description = cleanText(req.body.Body, 500);
      const messageSid = req.body.MessageSid;

      if (!phone || !description || !messageSid) {
        res.status(400).send('Mangler From, Body eller MessageSid');
        return;
      }

      // Idempotens: hvis Twilio sender samme SMS igen (fx efter timeout), genbruger vi sagen
      let lostCase = await LostCase.findByMessageSid(messageSid);
      if (!lostCase) {
        try {
          lostCase = await LostCase.createFromSms({ phone, description, message_sid: messageSid });
        } catch (error) {
          // To samtidige requests med samme MessageSid: den anden rammer UNIQUE-nøglen
          if (error.code !== 'ER_DUP_ENTRY') throw error;
          lostCase = await LostCase.findByMessageSid(messageSid);
        }
      }

      const reply = `Tak for din besked. Vi har oprettet sag ${lostCase.case_number} og giver besked, når vi finder din ting. Følg sagen her: ${NotificationService.caseUrl(lostCase)}`;

      res.type('text/xml').send(SmsService.replyXml(reply));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { WebhookController };
