const mysql = require('mysql2/promise');
const { config } = require('../config.js');

// Databasen tilgås kun via host/port fra .env, så den kan flyttes til en anden server
// uden at ændre koden.
const dbConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  connectionLimit: 10,
  dateStrings: true,
};

class DatabaseController {
  static pool = null;

  static getConfig() {
    return dbConfig;
  }

  static async getPool() {
    if (!DatabaseController.pool) {
      DatabaseController.pool = mysql.createPool(dbConfig);
      await DatabaseController.pool.query('SELECT 1');
    }
    return DatabaseController.pool;
  }

  static async closePool() {
    if (DatabaseController.pool) {
      await DatabaseController.pool.end();
      DatabaseController.pool = null;
    }
  }
}

module.exports = { DatabaseController };
