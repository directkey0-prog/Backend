const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.user_metadata?.role || req.user?.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

module.exports = roleMiddleware;
