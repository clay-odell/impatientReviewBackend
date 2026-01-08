// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminControllers = require('../controllers/adminControllers');
const { requireAdminAuth } = require('../middleware/auth');

// Password flows
router.post('/register', adminControllers.register);
router.post('/login', adminControllers.login);
router.post('/logout', requireAdminAuth, adminControllers.logout);
router.post('/remove', requireAdminAuth, adminControllers.remove);

// WebAuthn flows
router.post('/webauthn/register/options', requireAdminAuth, adminControllers.webauthnRegisterOptions);
router.post('/webauthn/register/verify', requireAdminAuth, adminControllers.webauthnRegisterVerify);
router.post('/webauthn/auth/options', adminControllers.webauthnAuthOptions);
router.post('/webauthn/auth/verify', adminControllers.webauthnAuthVerify);

// Credential management
router.get('/credentials', requireAdminAuth, adminControllers.listCredentials);
router.delete('/credentials/:id', requireAdminAuth, adminControllers.removeCredential);

module.exports = router;
