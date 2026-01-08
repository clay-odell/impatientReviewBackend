// routes/index.js
const express = require('express');
const router = express.Router();

// Mount admin routes (adjust filename if different)
const adminRoutes = require('./AdminRoutes');

// Health check
router.get('/healthz', (req, res) => res.status(200).send('ok'));

// Root API info
router.get('/', (req, res) => res.json({ service: 'impatient-review', status: 'ok' }));

// Mount admin routes at /api/admin
router.use('/admin', adminRoutes);

// 404 for unknown API routes under /api
router.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = router;
