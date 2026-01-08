// backend/models/admin.js
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const base64url = require("base64url");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const BCRYPT_WORK_FACTOR = parseInt(process.env.BCRYPT_WORK_FACTOR || "12", 10);

// WebAuthn / RP configuration - set these in env
const rpName = process.env.WEBAUTHN_RP_NAME || "MyApp";
const rpID = process.env.WEBAUTHN_RP_ID || "example.com";
const origin = process.env.WEBAUTHN_ORIGIN || "https://example.com";

class Admin {
  // Register admin with email + password (optional)
  static async register({ email, password, username }) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Basic validation
      if (!email) throw new Error("Email required");
      if (!password) throw new Error("Password required");
      if (!username) throw new Error("Name required");

      // Normalize and validate name
      const cleanName = username ? String(username).trim() : null;
      if (cleanName && cleanName.length > 100) {
        throw new Error("Name must be 100 characters or fewer");
      }

      const dup = await client.query("SELECT 1 FROM admins WHERE email=$1", [
        email,
      ]);
      if (dup.rows[0]) {
        throw new Error("Email already registered");
      }

      const passwordHash = password
        ? await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
        : null;

      const res = await client.query(
        `INSERT INTO admins (email, password_hash, username)
       VALUES ($1, $2, $3)
       RETURNING id, email, username`,
        [email, passwordHash, cleanName]
      );

      await client.query("COMMIT");
      return res.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Remove admin and associated passwordless credentials
  static async remove(adminId) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "DELETE FROM passwordless_credentials WHERE user_id=$1",
        [adminId]
      );
      await client.query("DELETE FROM admins WHERE id=$1", [adminId]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Authenticate by password
  static async authenticatePassword({ email, password }) {
    const res = await db.query(
      "SELECT id, password_hash, name FROM admins WHERE email=$1",
      [email]
    );
    const row = res.rows[0];
    if (!row || !row.password_hash) return null;
    const ok = await bcrypt.compare(password, row.password_hash);
    return ok ? { id: row.id, email, name: row.username } : null;
  }

  static async findByEmail(email) {
    const res = await db.query(
      "SELECT id, email, username, password_hash FROM admins WHERE email=$1",
      [email]
    );
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await db.query(
      "SELECT id, email, username FROM admins WHERE id=$1",
      [id]
    );
    return res.rows[0] || null;
  }

  // --- WebAuthn helpers ---

  // Generate registration options for client navigator.credentials.create
  // store the challenge in session on the server side (not shown here)
  // Accepts optional userName to show a friendly display name in the authenticator UI
  static async generateWebAuthnRegistrationOptions({
    adminId,
    userEmail,
    userName,
  }) {
    // fetch existing credential IDs to exclude duplicates
    const res = await db.query(
      "SELECT credential_id FROM passwordless_credentials WHERE user_id=$1",
      [adminId]
    );
    const excludeCredentials = res.rows.map((r) => ({
      id: r.credential_id, // Buffer stored in DB
      type: "public-key",
    }));

    const options = generateRegistrationOptions({
      rpName,
      rpID,
      userID: adminId,
      userName: userName || userEmail,
      attestationType: "none",
      authenticatorSelection: {
        userVerification: "preferred",
      },
      // exclude existing credentials to prevent duplicates
      excludeCredentials,
    });
    // Return options to client; server must save options.challenge in session
    return options;
  }

  // Verify registration response from client and persist credential
  static async verifyWebAuthnRegistration({
    adminId,
    registrationResponse,
    expectedChallenge,
  }) {
    // registrationResponse is the JSON returned from navigator.credentials.create
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified) {
      throw new Error("WebAuthn registration verification failed");
    }

    const { credentialPublicKey, credentialID, counter } =
      verification.registrationInfo;

    // store credential in DB
    await db.query(
      `INSERT INTO passwordless_credentials (user_id, credential_id, public_key, sign_count, transports)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        adminId,
        Buffer.from(credentialID), // credentialID is ArrayBuffer-like; ensure Buffer
        Buffer.from(credentialPublicKey),
        counter || 0,
        registrationResponse.transports || null,
      ]
    );

    return true;
  }

  // Generate authentication options for client navigator.credentials.get
  static async generateWebAuthnAuthenticationOptions({ adminId }) {
    // fetch credential IDs for this admin
    const res = await db.query(
      "SELECT credential_id FROM passwordless_credentials WHERE user_id=$1",
      [adminId]
    );
    const allowCredentials = res.rows.map((r) => ({
      id: base64url.encode(r.credential_id),
      type: "public-key",
    }));

    const options = generateAuthenticationOptions({
      allowCredentials,
      userVerification: "preferred",
      rpID,
    });

    // Save options.challenge in session for later verification
    return options;
  }

  // Verify authentication assertion from client
  static async verifyWebAuthnAuthentication({
    adminId,
    authenticationResponse,
    expectedChallenge,
  }) {
    // load credential by credentialId
    const credIdBuffer = Buffer.from(authenticationResponse.id, "base64url");
    const res = await db.query(
      "SELECT id, credential_id, public_key, sign_count FROM passwordless_credentials WHERE user_id=$1 AND credential_id=$2",
      [adminId, credIdBuffer]
    );
    const cred = res.rows[0];
    if (!cred) throw new Error("Unknown credential");

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: cred.credential_id,
        credentialPublicKey: cred.public_key,
        counter: Number(cred.sign_count),
      },
    });

    if (!verification.verified) {
      throw new Error("WebAuthn authentication failed");
    }

    // update sign_count to prevent replay
    await db.query(
      "UPDATE passwordless_credentials SET sign_count=$1 WHERE id=$2",
      [verification.authenticationInfo.newCounter, cred.id]
    );

    // return admin info so caller can create a session with name/email
    const adminRes = await db.query(
      "SELECT id, email, name FROM admins WHERE id=$1",
      [adminId]
    );
    const adminRow = adminRes.rows[0];
    if (!adminRow) throw new Error("Admin not found after authentication");

    return { id: adminId, email: adminRow.email, name: adminRow.name };
  }

  // Utility: list admin credentials
  static async listCredentials(adminId) {
    const res = await db.query(
      "SELECT id, credential_id, transports, sign_count, created_at FROM passwordless_credentials WHERE user_id=$1",
      [adminId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      credentialId: base64url.encode(r.credential_id),
      transports: r.transports,
      signCount: r.sign_count,
      createdAt: r.created_at,
    }));
  }

  // Utility: remove a specific credential
  static async removeCredential(credentialId) {
    const buf = Buffer.from(credentialId, "base64url");
    await db.query(
      "DELETE FROM passwordless_credentials WHERE credential_id=$1",
      [buf]
    );
  }
}

module.exports = Admin;
