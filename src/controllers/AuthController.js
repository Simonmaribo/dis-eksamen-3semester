const bcrypt = require('bcrypt');
const { Staff } = require('../models/Staff.js');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email og password er påkrævet.' });
        return;
      }

      const staff = await Staff.findByEmail(email);
      // bcrypt.compare hasher det indtastede password med samme salt og sammenligner
      if (!staff || !(await bcrypt.compare(password, staff.password))) {
        res.status(401).json({ error: 'Forkert email eller password.' });
        return;
      }

      // Session-id'et gemmes i en cookie hos browseren, selve sessionen i MySQL
      req.session.staffId = staff.id;
      req.session.isAdmin = staff.is_admin;
      res.json(staff);
    } catch (error) {
      next(error);
    }
  }

  static logout(req, res) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  }

  static async me(req, res, next) {
    try {
      const staff = await Staff.findById(req.session.staffId);
      if (!staff) {
        res.status(401).json({ error: 'Ikke logget ind' });
        return;
      }
      res.json(staff);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { AuthController };
