const { config } = require('../config.js');
const { SmsService } = require('./SmsService.js');
const { EmailService } = require('./EmailService.js');

class NotificationService {
  static caseUrl(lostCase) {
    return `${config.PUBLIC_URL}/sag/${lostCase.token}`;
  }

  // Kunden får besked i samme kanal som sagen kom fra: web = mail, SMS = SMS
  static async notifyFound(lostCase) {
    const text = `Din ting er fundet! Du kan hente den i receptionen på Hotel Kastanje med sagsnummer ${lostCase.case_number}.`;

    if (lostCase.channel === 'sms') {
      await SmsService.send(lostCase.phone, text);
    } else {
      await EmailService.send(
        lostCase.email,
        `Din ting er fundet (${lostCase.case_number})`,
        `Hej ${lostCase.name}\n\n${text}\n\nSe sagen her: ${NotificationService.caseUrl(lostCase)}\n\nVenlig hilsen\nHotel Kastanje`
      );
    }
  }
}

module.exports = { NotificationService };
