
exports.requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.admin && req.session.admin.id) return next();
  return res.status(401).json({ error: 'Unauthorized' });
};
