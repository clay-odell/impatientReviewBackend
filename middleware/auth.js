// middleware/authMiddleware.js
const { UnauthorizedError } = require('../expressError');

exports.requireAdminAuth = (req, res, next) => {
  try {
    if (req.session && req.session.admin && req.session.admin.id) return next();
    throw new UnauthorizedError();
  } catch (err) {
    next(err);
  }
};
