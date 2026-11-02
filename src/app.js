const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const morgan = require('morgan');
const responseTime = require('response-time');
const path = require('path');
const { config } = require('./config.js');
const { DatabaseController } = require('./controllers/DatabaseController.js');
const { requireLogin } = require('./middleware/authMiddleware.js');
const { errorHandler } = require('./middleware/errorHandler.js');

const authRoutes = require('./routes/authRoutes.js');
const caseRoutes = require('./routes/caseRoutes.js');
const foundItemRoutes = require('./routes/foundItemRoutes.js');
const staffRoutes = require('./routes/staffRoutes.js');
const webhookRoutes = require('./routes/webhookRoutes.js');

const app = express();

// Appen kører bag Nginx på serveren, så vi stoler på X-Forwarded-For/-Proto fra én proxy
app.set('trust proxy', 1);

// Sikkerheds-headers. Billeder må også komme fra Cloudinarys CDN.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
      // Tving kun browseren over på HTTPS, når serveren faktisk kører med HTTPS
      'upgrade-insecure-requests': config.PUBLIC_URL.startsWith('https://') ? [] : null,
    },
  },
}));

// Måling: X-Response-Time-header på alle svar, og en log-linje pr. request
app.use(responseTime());
app.use(morgan(':date[iso] :method :url :status :response-time ms'));

app.use(express.static(path.join(__dirname, '../public'), { extensions: ['html'] }));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions gemmes i MySQL, så login virker uanset hvilken app-instans load balanceren sender os til
app.use(session({
  secret: config.SESSION_SECRET,
  store: new MySQLStore(DatabaseController.getConfig()),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 12 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: config.PUBLIC_URL.startsWith('https://'),
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/found-items', requireLogin, foundItemRoutes);
app.use('/api/staff', requireLogin, staffRoutes);
app.use('/webhooks', webhookRoutes);

// Kundens sagsside. Selve sagen hentes bagefter med fetch fra /api/cases/public/:token
app.get('/sag/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sag.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint findes ikke' });
});

app.use(errorHandler);

module.exports = app;
