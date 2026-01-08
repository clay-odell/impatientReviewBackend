require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const routes = require('./routes');
const {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenRequestError
} = require('./expressError'); // adjust path

const app = express();

// trust proxy so req.protocol and req.secure reflect the original request
app.set('trust proxy', true);

app.use(helmet());
app.use(express.json());
app.use(morgan('tiny'));

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://api.impatientreview.com')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (curl, mobile, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
}));

// respond to preflight quickly
app.options(/.*/, cors());


// mount API
app.use('/api', routes);



// 404 for unknown API routes (if not already present)
app.use((req, res, next) => {
  next(new NotFoundError());
});

// centralized error handler
app.use((err, req, res, next) => {
  // If it's one of your ExpressError subclasses, use its status/message
  if (err instanceof ExpressError) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }

  // For validation libraries or other known shapes, normalize here
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message || 'Validation error' });
  }

  // Fallback: unexpected error
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});


module.exports = app;
