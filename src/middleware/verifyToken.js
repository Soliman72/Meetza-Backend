const jwt = require("jsonwebtoken");
const {
  getBearerTokenFromRequest,
  loadUserFromAccessToken,
} = require("../utils/authJwtUser");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        code: "NO_TOKEN",
      });
    }

    req.user = await loadUserFromAccessToken(token);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please sign in again.",
        code: "TOKEN_EXPIRED",
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        code: "INVALID_TOKEN",
        error: error.message,
      });
    }
    const status = error.status || 401;
    return res.status(status).json({
      success: false,
      message: error.message || "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};
