require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const path = require('path');   // ✅ Needed for SPA fallback

const routes = require('./routes');
const {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenRequestError
} = require('./expressError');

const app = express();

// ------------------------------------------------------------
// TRUST PROXY (required for secure cookies behind nginx/HTTPS)
// ------------------------------------------------------------
app.set('trust proxy', 1);

// ------------------------------------------------------------
// SESSION STORE (required for login to work)
// ------------------------------------------------------------
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  session({
    store: new pgSession({
      pool: pgPool,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    },
  })
);


// ------------------------------------------------------------
// STANDARD MIDDLEWARE
// ------------------------------------------------------------
app.use(helmet());
app.use(express.json());
app.use(morgan('tiny'));

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://api.impatientreview.com')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl / server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
}));

app.options(/.*/, cors());

// ------------------------------------------------------------
// API ROUTES
// ------------------------------------------------------------
app.use('/api', routes);



// ------------------------------------------------------------
// 404 HANDLER
// ------------------------------------------------------------
app.use((req, res, next) => {
  next(new NotFoundError());
});

// ------------------------------------------------------------
// CENTRAL ERROR HANDLER
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err instanceof ExpressError) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }

  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message || 'Validation error' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
