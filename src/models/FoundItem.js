const { DatabaseController } = require('../controllers/DatabaseController.js');

class FoundItem {
  constructor(data) {
    this.id = data.id;
    this.description = data.description;
    this.found_date = data.found_date;
    this.location = data.location;
    this.image_url = data.image_url;
    this.created_by = data.created_by;
    this.created_by_name = data.created_by_name;
    this.created_at = data.created_at;
    // Sættes når tingen er matchet med en sag
    this.case_id = data.case_id || null;
    this.case_status = data.case_status || null;
  }

  static async findById(id) {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query(
      `SELECT f.*, s.name AS created_by_name, c.id AS case_id, c.status AS case_status
       FROM found_items f
       JOIN staff s ON s.id = f.created_by
       LEFT JOIN lost_cases c ON c.found_item_id = f.id
       WHERE f.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return new FoundItem(rows[0]);
  }

  static async findAll() {
    const pool = await DatabaseController.getPool();
    const [rows] = await pool.query(
      `SELECT f.*, s.name AS created_by_name, c.id AS case_id, c.status AS case_status
       FROM found_items f
       JOIN staff s ON s.id = f.created_by
       LEFT JOIN lost_cases c ON c.found_item_id = f.id
       ORDER BY f.found_date DESC, f.id DESC`
    );
    return rows.map(row => new FoundItem(row));
  }

  static async create({ description, found_date, location, image_url, created_by }) {
    const pool = await DatabaseController.getPool();
    const [result] = await pool.query(
      `INSERT INTO found_items (description, found_date, location, image_url, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [description, found_date, location, image_url, created_by]
    );
    return FoundItem.findById(result.insertId);
  }
}

module.exports = { FoundItem };
