const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    db.query("SELECT * FROM user WHERE id = ?", [decoded.id], (err, rows) => {
      if (err) return res.status(400).json({ error: err });
      req.user = rows[0];
      next();
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};
