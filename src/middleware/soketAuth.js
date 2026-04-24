const getTokenFromHandshake = require("../utils/tokenFormHandshake");
const { loadUserFromAccessToken } = require("../utils/authJwtUser");

/**
 * مصادقة Socket.IO — لا تُستخدم كـ Express middleware.
 * تُسجَّل مرة واحدة على `io` في server.js مع باقي الـ namespaces.
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = getTokenFromHandshake(socket);
    if (!token) {
      return next(new Error("Authentication token missing"));
    }
    socket.user = await loadUserFromAccessToken(token);
    return next();
  } catch {
    return next(new Error("Authentication failed"));
  }
};

module.exports = authenticateSocket;
