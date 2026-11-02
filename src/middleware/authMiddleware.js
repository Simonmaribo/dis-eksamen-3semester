function requireLogin(req, res, next) {
  if (!req.session.staffId) {
    res.status(401).json({ error: 'Ikke logget ind' });
    return;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    res.status(403).json({ error: 'Kun admins har adgang' });
    return;
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
