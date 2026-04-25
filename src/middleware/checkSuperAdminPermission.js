const httpError = require("../utils/httpError");

exports.requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Super_Admin') {
    next();
  } else {
    return res.status(403).json(httpError(403, "Access denied. Super Admins only."));
  }
};
