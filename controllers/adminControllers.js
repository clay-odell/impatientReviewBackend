// backend/controllers/adminController.js
const Admin = require('../models/Admin');
const base64url = require('base64url');
const {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError
} = require('../expressError');

// Helper to set secure session cookie
function createSession(req, res, admin) {
  if (!req || !res || !admin) throw new Error('createSession missing args');
  if (!req.session) throw new Error('Session middleware not configured');
  req.session.admin = { id: admin.id, email: admin.email };
  // Ensure sessionID exists (express-session)
  const sid = req.sessionID;
  if (!sid) throw new Error('Session ID missing');
  res.cookie('__Host-ir_session', sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}

// Helper: ensure admin session exists
function requireSessionAdmin(req) {
  if (!req.session || !req.session.admin || !req.session.admin.id) {
    throw new UnauthorizedError();
  }
  return req.session.admin;
}

// Register with password
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new BadRequestError('Email and password required');
    const admin = await Admin.register({ email, password });
    res.status(201).json({ admin });
  } catch (err) {
    next(err);
  }
};

// Password login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new BadRequestError('Email and password required');
    const admin = await Admin.authenticatePassword({ email, password });
    if (!admin) throw new UnauthorizedError('Invalid credentials');
    createSession(req, res, admin);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Logout
exports.logout = (req, res, next) => {
  try {
    requireSessionAdmin(req);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('__Host-ir_session');
      res.json({ ok: true });
    });
  } catch (err) {
    next(err);
  }
};

// Remove admin
exports.remove = async (req, res, next) => {
  try {
    const adminSession = requireSessionAdmin(req);
    const adminId = adminSession.id;
    await Admin.remove(adminId);
    req.session.destroy((err) => {
      if (err) return next(err);
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
    const adminSession = requireSessionAdmin(req);
    const adminId = adminSession.id;
    const userEmail = adminSession.email;
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
    requireSessionAdmin(req);
    const adminId = req.session.admin.id;
    const expectedChallenge = req.session.webauthnChallenge;
    if (!expectedChallenge) throw new BadRequestError('Missing registration challenge in session');
    const registrationResponse = req.body;
    if (!registrationResponse) throw new BadRequestError('Missing registration response');
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
    const { email } = req.body || {};
    if (!email) throw new BadRequestError('Email required');
    const adminRow = await Admin.findByEmail(email);
    if (!adminRow) throw new NotFoundError('Admin not found');
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
    const expectedChallenge = req.session && req.session.webauthnChallenge;
    const adminId = req.session && req.session.webauthnUserId;
    if (!expectedChallenge || !adminId) throw new BadRequestError('Missing authentication challenge or user id in session');
    const authenticationResponse = req.body;
    if (!authenticationResponse) throw new BadRequestError('Missing authentication response');
    await Admin.verifyWebAuthnAuthentication({ adminId, authenticationResponse, expectedChallenge });
    // create session for admin
    const admin = await Admin.findById(adminId);
    if (!admin) throw new NotFoundError('Admin not found after authentication');
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
    const adminSession = requireSessionAdmin(req);
    const adminId = adminSession.id;
    const creds = await Admin.listCredentials(adminId);
    res.json({ credentials: creds });
  } catch (err) {
    next(err);
  }
};

// Remove credential
exports.removeCredential = async (req, res, next) => {
  try {
    requireSessionAdmin(req);
    const credentialId = req.params.id; // expected base64url id
    if (!credentialId) throw new BadRequestError('Missing credential id');
    // validate base64url format
    try {
      // decode to ensure valid base64url; model may expect original string or buffer
      base64url.toBuffer(credentialId);
    } catch (e) {
      throw new BadRequestError('Invalid credential id format');
    }
    await Admin.removeCredential(credentialId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
