const db = require("../config/db");

// Middleware to verify JWT token
exports.checkAdmin = (req, res, next) => {
  try {
    // console.log(req.user);
    if (req.user && req.user.role === "Administrator") {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};
