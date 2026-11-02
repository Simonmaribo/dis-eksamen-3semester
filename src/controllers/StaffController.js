const bcrypt = require('bcrypt');
const { Staff } = require('../models/Staff.js');
const { isValidEmail, cleanText } = require('../middleware/validation.js');

class StaffController {
  static async listStaff(req, res, next) {
    try {
      const staff = await Staff.findAll();
      res.json(staff);
    } catch (error) {
      next(error);
    }
  }

  // Kun admins kan oprette nye medarbejdere
  static async createStaff(req, res, next) {
    try {
      const name = cleanText(req.body.name, 100);
      const email = cleanText(req.body.email, 255);
      const password = req.body.password;
      const isAdmin = req.body.is_admin === true;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Alle felter er påkrævet.' });
        return;
      }
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Email-adressen er ikke gyldig.' });
        return;
      }
      if (typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ error: 'Password skal være mindst 8 tegn.' });
        return;
      }
      if (await Staff.findByEmail(email)) {
        res.status(409).json({ error: 'Der findes allerede en medarbejder med den email.' });
        return;
      }

      // bcrypt gemmer kun et saltet hash, aldrig selve passwordet
      const passwordHash = await bcrypt.hash(password, 12);
      const staff = await Staff.create(name, email, passwordHash, isAdmin);
      res.status(201).json(staff);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { StaffController };
