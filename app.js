// app.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan('tiny'));

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
