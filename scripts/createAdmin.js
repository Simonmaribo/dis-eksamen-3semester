// Opretter den første admin ud fra ADMIN_NAME, ADMIN_EMAIL og ADMIN_PASSWORD i .env. Kør: npm run db:admin
const bcrypt = require('bcrypt');
const { Staff } = require('../src/models/Staff.js');
const { DatabaseController } = require('../src/controllers/DatabaseController.js');

async function createAdmin() {
  const name = process.env.ADMIN_NAME || 'Admin';
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 8) {
    throw new Error('Sæt ADMIN_EMAIL og ADMIN_PASSWORD (mindst 8 tegn) i .env');
  }

  if (await Staff.findByEmail(email)) {
    console.log(`admin ${email} findes allerede`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await Staff.create(name, email, passwordHash, true);
    console.log(`admin ${email} oprettet`);
  }
  await DatabaseController.closePool();
}

createAdmin().catch(async (error) => {
  console.error('kunne ikke oprette admin:', error.message);
  await DatabaseController.closePool();
  process.exit(1);
});
