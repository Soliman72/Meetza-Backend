const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

function getJwtVerifyOptions() {
  const tol = Number(process.env.JWT_CLOCK_TOLERANCE);
  return {
    clockTolerance: Number.isFinite(tol) && tol >= 0 ? tol : 120,
  };
}

/** Bearer أو التوكن الخام في Authorization (متوافق مع REST). */
function getBearerTokenFromRequest(req) {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== "string") return null;
  const trimmed = auth.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("bearer ")) {
    const t = trimmed.slice(7).trim();
    return t || null;
  }
  if (trimmed.split(".").length === 3) return trimmed;
  return null;
}

/**
 * JWT + تحميل المستخدم — نفس المنطق لـ Socket (`soketAuth`) وـ REST (`verifyToken`).
 */
async function loadUserFromAccessToken(token) {
  if (!token) {
    const e = new Error("No token provided");
    e.status = 401;
    throw e;
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET,
    getJwtVerifyOptions()
  );

  const user = await userRepository.findById(decoded.id);
  if (!user) {
    const e = new Error("User not found");
    e.status = 401;
    throw e;
  }

  return user;
}

module.exports = {
  getJwtVerifyOptions,
  getBearerTokenFromRequest,
  loadUserFromAccessToken,
};
