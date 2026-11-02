const crypto = require('crypto');
const { DatabaseController } = require('../controllers/DatabaseController.js');

const STATUS_LABELS = {
  soeges: 'Vi leder efter din ting',
  fundet: 'Fundet, klar til afhentning',
  udleveret: 'Udleveret',
};

class LostCase {
  constructor(data) {
    this.id = data.id;
    this.token = data.token;
    this.channel = data.channel;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.description = data.description;
    this.lost_date = data.lost_date;
    this.location = data.location;
    this.status = data.status;
    this.found_item_id = data.found_item_id;
    this.message_sid = data.message_sid;
    this.created_at = data.created_at;
  }

  // Sagsnummeret kunden ser, fx HG-1007
  get case_number() {
    return 'HG-' + (1000 + this.id);
  }

  get status_label() {
    return STATUS_LABELS[this.status];
  }

  // Til personalet
  toJSON() {
    return {
      id: this.id,
      case_number: this.case_number,
      channel: this.channel,
      name: this.name,
      email: this.email,
      phone: this.phone,
      description: this.description,
      lost_date: this.lost_date,
      location: this.location,
      status: this.status,
      status_label: this.status_label,
      found_item_id: this.found_item_id,
      created_at: this.created_at,
    };
  }

  // Til kunden via det hemmelige link: ingen kontaktoplysninger eller interne id'er
  toPublicJSON() {
    return {
      case_number: this.case_number,
      description: this.description,
      lost_date: this.lost_date,
      location: this.location,
      status: this.status,
      status_label: this.status_label,
      created_at: this.created_at,
    };
  }

  static newToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  static async findById(id) {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query('SELECT * FROM lost_cases WHERE id = ?', [id]);

    if (rows.length === 0) return null;
    return new LostCase(rows[0]);
  }

  static async findByToken(token) {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query('SELECT * FROM lost_cases WHERE token = ?', [token]);

    if (rows.length === 0) return null;
    return new LostCase(rows[0]);
  }

  static async findByMessageSid(messageSid) {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query('SELECT * FROM lost_cases WHERE message_sid = ?', [messageSid]);

    if (rows.length === 0) return null;
    return new LostCase(rows[0]);
  }

  static async findAll() {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query(
      `SELECT * FROM lost_cases
       ORDER BY FIELD(status, 'soeges', 'fundet', 'udleveret'), created_at DESC`
    );
    return rows.map(row => new LostCase(row));
  }

  static async createFromWeb({ name, email, phone, description, lost_date, location }) {
    const pool = await DatabaseController.getPool();
    const [result] = await pool.query(
      `INSERT INTO lost_cases (token, channel, name, email, phone, description, lost_date, location)
       VALUES (?, 'web', ?, ?, ?, ?, ?, ?)`,
      [LostCase.newToken(), name, email, phone || null, description, lost_date, location]
    );
    return LostCase.findById(result.insertId);
  }

  static async createFromSms({ phone, description, message_sid }) {
    const pool = await DatabaseController.getPool();
    const [result] = await pool.query(
      `INSERT INTO lost_cases (token, channel, phone, description, message_sid)
       VALUES (?, 'sms', ?, ?, ?)`,
      [LostCase.newToken(), phone, description, message_sid]
    );
    return LostCase.findById(result.insertId);
  }

  // Returnerer false hvis sagen ikke længere søges, eller tingen allerede er matchet
  static async matchWithFoundItem(caseId, foundItemId) {
    const pool = await DatabaseController.getPool();
    try {
      const [result] = await pool.query(
        `UPDATE lost_cases SET status = 'fundet', found_item_id = ?
         WHERE id = ? AND status = 'soeges'`,
        [foundItemId, caseId]
      );
      return result.affectedRows === 1;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') return false;
      throw error;
    }
  }

  static async markDelivered(caseId) {
    const pool = await DatabaseController.getPool();
    const [result] = await pool.query(
      `UPDATE lost_cases SET status = 'udleveret' WHERE id = ? AND status = 'fundet'`,
      [caseId]
    );
    return result.affectedRows === 1;
  }
}

module.exports = { LostCase };
