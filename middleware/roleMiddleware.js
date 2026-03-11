const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.user_metadata?.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

module.exports = roleMiddleware;