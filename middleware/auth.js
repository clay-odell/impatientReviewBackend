// backend/middleware/auth.js
const { UnauthorizedError } = require("../expressError");

/**
 * Middleware that ensures an admin session exists.
 * Keeps the original export name requireAdminAuth for compatibility,
 * and also exports requireAdmin so routes that expect that name work.
 */
function requireAdminAuth(req, res, next) {
  try {
    if (req.session && req.session.admin && req.session.admin.id) return next();
    throw new UnauthorizedError();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  requireAdminAuth,
  requireAdmin: requireAdminAuth
};
