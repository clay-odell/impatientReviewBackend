// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Password flows
router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.post('/logout', requireAdminAuth, adminController.logout);
router.post('/remove', requireAdminAuth, adminController.remove);

// WebAuthn flows
router.post('/webauthn/register/options', requireAdminAuth, adminController.webauthnRegisterOptions);
router.post('/webauthn/register/verify', requireAdminAuth, adminController.webauthnRegisterVerify);
router.post('/webauthn/auth/options', adminController.webauthnAuthOptions);
router.post('/webauthn/auth/verify', adminController.webauthnAuthVerify);

// Credential management
router.get('/credentials', requireAdminAuth, adminController.listCredentials);
router.delete('/credentials/:id', requireAdminAuth, adminController.removeCredential);

module.exports = router;
