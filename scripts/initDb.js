// Opretter tabellerne fra db/schema.sql. Kør: npm run db:init
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { DatabaseController } = require('../src/controllers/DatabaseController.js');

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  const connection = await mysql.createConnection({
    ...DatabaseController.getConfig(),
    multipleStatements: true,
  });

  await connection.query(sql);
  await connection.end();
  console.log('tabeller oprettet');
}

initDb().catch((error) => {
  console.error('kunne ikke oprette tabeller:', error.message);
  process.exit(1);
});
