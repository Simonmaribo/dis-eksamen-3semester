const { DatabaseController } = require('../controllers/DatabaseController.js');

class Staff {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.is_admin = Boolean(data.is_admin);
    this.created_at = data.created_at;
  }

  // Det vi sender til frontend. Password-hashen forlader aldrig serveren.
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      is_admin: this.is_admin,
      created_at: this.created_at,
    };
  }

  static async findByEmail(email) {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query('SELECT * FROM staff WHERE email = ?', [email]);

    if (rows.length === 0) return null;
    return new Staff(rows[0]);
  }

  static async findById(id) {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);

    if (rows.length === 0) return null;
    return new Staff(rows[0]);
  }

  static async findAll() {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query('SELECT * FROM staff ORDER BY name');
    return rows.map(row => new Staff(row));
  }

  static async create(name, email, passwordHash, isAdmin) {
    const pool = await DatabaseController.getPool();
    const [result] = await pool.query(
      'INSERT INTO staff (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, isAdmin]
    );
    return Staff.findById(result.insertId);
  }
}

module.exports = { Staff };
