// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminControllers = require('../controllers/adminControllers');
const { requireAdminAuth } = require('../middleware/auth');

// Password flows
router.post('/register', adminControllers.register);
router.post('/login', adminControllers.login);
router.post('/logout',  adminControllers.logout);
router.post('/remove', requireAdminAuth, adminControllers.remove);

// WebAuthn flows
router.post('/webauthn/register/options', requireAdminAuth, adminControllers.webauthnRegisterOptions);
router.post('/webauthn/register/verify', requireAdminAuth, adminControllers.webauthnRegisterVerify);
router.post('/webauthn/auth/options', adminControllers.webauthnAuthOptions);
router.post('/webauthn/auth/verify', adminControllers.webauthnAuthVerify);

// Credential management
router.get('/credentials', requireAdminAuth, adminControllers.listCredentials);
router.delete('/credentials/:id', requireAdminAuth, adminControllers.removeCredential);
// Session check
router.get('/me', (req, res) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    id: req.session.adminId,
    email: req.session.adminEmail,
    username: req.session.adminUsername,
  });
});

module.exports = router;
