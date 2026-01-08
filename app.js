require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const routes = require('./routes');

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
app.options('/*', cors());

// mount API
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 3007;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
