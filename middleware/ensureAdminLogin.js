module.exports = function ensureAdminLogin(req, res, next) {
  try {
    // Your admin session flag (set during login)
    if (req.session && req.session.isAdmin === true) {
      return next();
    }

    return res.status(401).json({
      error: "Admin login required"
    });
  } catch (err) {
    console.error("ensureAdminLogin error:", err);
    return res.status(500).json({
      error: "Internal authentication error"
    });
  }
};
