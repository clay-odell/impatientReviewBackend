// backend/controllers/adminController.js
const Admin = require('../models/admin');
const base64url = require('base64url');

// Helper to set secure session cookie
function createSession(req, res, admin) {
  req.session.admin = { id: admin.id, email: admin.email };
  res.cookie('__Host-ir_session', req.sessionID, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}

// Register with password
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.register({ email, password });
    res.status(201).json({ admin });
  } catch (err) {
    next(err);
  }
};

// Password login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.authenticatePassword({ email, password });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    createSession(req, res, admin);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('__Host-ir_session');
    res.json({ ok: true });
  });
};

// Remove admin
exports.remove = async (req, res, next) => {
  try {
    const adminId = req.session.admin.id;
    await Admin.remove(adminId);
    req.session.destroy(() => {
      res.clearCookie('__Host-ir_session');
      res.json({ ok: true });
    });
  } catch (err) {
    next(err);
  }
};

// WebAuthn: registration options
exports.webauthnRegisterOptions = async (req, res, next) => {
  try {
    const adminId = req.session.admin.id;
    const userEmail = req.session.admin.email;
    const options = await Admin.generateWebAuthnRegistrationOptions({ adminId, userEmail });
    // Save challenge server-side (session)
    req.session.webauthnChallenge = options.challenge;
    res.json(options);
  } catch (err) {
    next(err);
  }
};

// WebAuthn: verify registration
exports.webauthnRegisterVerify = async (req, res, next) => {
  try {
    const adminId = req.session.admin.id;
    const expectedChallenge = req.session.webauthnChallenge;
    const registrationResponse = req.body;
    await Admin.verifyWebAuthnRegistration({ adminId, registrationResponse, expectedChallenge });
    delete req.session.webauthnChallenge;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// WebAuthn: auth options (login)
exports.webauthnAuthOptions = async (req, res, next) => {
  try {
    const { email } = req.body; // user supplies email to identify which credentials to allow
    const adminRow = await Admin.findByEmail(email);
    if (!adminRow) return res.status(404).json({ error: 'Not found' });
    const options = await Admin.generateWebAuthnAuthenticationOptions({ adminId: adminRow.id });
    req.session.webauthnChallenge = options.challenge;
    req.session.webauthnUserId = adminRow.id;
    res.json(options);
  } catch (err) {
    next(err);
  }
};

// WebAuthn: verify auth assertion
exports.webauthnAuthVerify = async (req, res, next) => {
  try {
    const expectedChallenge = req.session.webauthnChallenge;
    const adminId = req.session.webauthnUserId;
    const authenticationResponse = req.body;
    await Admin.verifyWebAuthnAuthentication({ adminId, authenticationResponse, expectedChallenge });
    // create session for admin
    const admin = await Admin.findById(adminId);
    createSession(req, res, admin);
    delete req.session.webauthnChallenge;
    delete req.session.webauthnUserId;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// List credentials
exports.listCredentials = async (req, res, next) => {
  try {
    const adminId = req.session.admin.id;
    const creds = await Admin.listCredentials(adminId);
    res.json({ credentials: creds });
  } catch (err) {
    next(err);
  }
};

// Remove credential
exports.removeCredential = async (req, res, next) => {
  try {
    const credentialId = req.params.id; // base64url id
    await Admin.removeCredential(credentialId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
