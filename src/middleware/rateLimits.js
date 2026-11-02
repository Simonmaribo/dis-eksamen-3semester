const rateLimit = require('express-rate-limit');

// Beskytter login mod brute force: maks 10 forsøg pr. IP pr. 15 minutter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'For mange loginforsøg. Prøv igen om 15 minutter.' },
});

// Beskytter den offentlige formular mod spam: maks 10 sager pr. IP pr. time
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { error: 'For mange henvendelser. Prøv igen senere.' },
});

module.exports = { loginLimiter, reportLimiter };
