// routes/index.js
const express = require('express');
const router = express.Router();

// These MUST match your actual filenames exactly (case‑sensitive on Linux)
const adminRoutes = require('./AdminRoutes'); 
const poemRoutes = require('./poemRoutes');

// Health check
router.get('/healthz', (req, res) => res.status(200).send('ok'));

// Root API info
router.get('/', (req, res) => res.json({ service: 'impatient-review', status: 'ok' }));

// Mount admin routes at /api/admin
router.use('/admin', adminRoutes);

// Mount poem routes at /api/poems
router.use('/poems', poemRoutes);

// 404 for unknown API routes under /api
router.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = router;
