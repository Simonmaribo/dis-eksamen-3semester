const { LostCase } = require('../models/LostCase.js');
const { isValidEmail, isValidDate, cleanText } = require('../middleware/validation.js');

class CaseController {
  // Kunden opretter en sag via webformularen
  static async createCase(req, res, next) {
    try {
      const name = cleanText(req.body.name, 100);
      const email = cleanText(req.body.email, 255);
      const phone = cleanText(req.body.phone, 30);
      const description = cleanText(req.body.description, 500);
      const location = cleanText(req.body.location, 100);
      const lost_date = req.body.lost_date;

      if (!name || !email || !description || !location || !lost_date) {
        res.status(400).json({ error: 'Udfyld venligst alle påkrævede felter.' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Email-adressen er ikke gyldig.' });
        return;
      }
      if (!isValidDate(lost_date)) {
        res.status(400).json({ error: 'Datoen er ikke gyldig.' });
        return;
      }

      const lostCase = await LostCase.createFromWeb({ name, email, phone, description, lost_date, location });

      res.status(201).json({
        case_number: lostCase.case_number,
        url: `/sag/${lostCase.token}`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Kunden ser status via sit hemmelige link
  static async showPublicCase(req, res, next) {
    try {
      const lostCase = await LostCase.findByToken(req.params.token);
      if (!lostCase) {
        res.status(404).json({ error: 'Sagen blev ikke fundet.' });
        return;
      }
      res.json(lostCase.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  // Personalet ser alle sager
  static async listCases(req, res, next) {
    try {
      const cases = await LostCase.findAll();
      res.json(cases);
    } catch (error) {
      next(error);
    }
  }

  // Personalet markerer at kunden har hentet tingen
  static async deliverCase(req, res, next) {
    try {
      const delivered = await LostCase.markDelivered(parseInt(req.params.id));
      if (!delivered) {
        res.status(409).json({ error: 'Sagen kan kun udleveres, når tingen er fundet.' });
        return;
      }
      res.json(await LostCase.findById(parseInt(req.params.id)));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { CaseController };
