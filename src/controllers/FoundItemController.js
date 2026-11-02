const { FoundItem } = require('../models/FoundItem.js');
const { LostCase } = require('../models/LostCase.js');
const { ImageService } = require('../services/ImageService.js');
const { NotificationService } = require('../services/NotificationService.js');
const { isValidDate, cleanText } = require('../middleware/validation.js');

class FoundItemController {
  static async listFoundItems(req, res, next) {
    try {
      const items = await FoundItem.findAll();
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  // Personalet registrerer en fundet ting, evt. med billede (multipart/form-data)
  static async createFoundItem(req, res, next) {
    try {
      const description = cleanText(req.body.description, 500);
      const location = cleanText(req.body.location, 100);
      const found_date = req.body.found_date;

      if (!description || !location || !found_date) {
        res.status(400).json({ error: 'Udfyld beskrivelse, dato og sted.' });
        return;
      }
      if (!isValidDate(found_date)) {
        res.status(400).json({ error: 'Datoen er ikke gyldig.' });
        return;
      }

      let image_url = null;
      if (req.file) {
        image_url = await ImageService.upload(req.file.buffer);
      }

      const item = await FoundItem.create({
        description,
        found_date,
        location,
        image_url,
        created_by: req.session.staffId,
      });
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  // Personalet matcher en fundet ting med en åben sag, og kunden får besked
  static async matchFoundItem(req, res, next) {
    try {
      const foundItemId = parseInt(req.params.id);
      const caseId = parseInt(req.body.case_id);

      const item = await FoundItem.findById(foundItemId);
      if (!item) {
        res.status(404).json({ error: 'Den fundne ting findes ikke.' });
        return;
      }

      const matched = await LostCase.matchWithFoundItem(caseId, foundItemId);
      if (!matched) {
        res.status(409).json({ error: 'Sagen søges ikke længere, eller tingen er allerede matchet.' });
        return;
      }

      const lostCase = await LostCase.findById(caseId);

      let notified = true;
      try {
        await NotificationService.notifyFound(lostCase);
      } catch (error) {
        // Matchet er gemt, selvom beskeden fejler. Personalet får det at vide og kan kontakte kunden.
        console.error('Kunne ikke sende besked til kunden:', error.message);
        notified = false;
      }

      res.json({ case: lostCase, notified });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { FoundItemController };
