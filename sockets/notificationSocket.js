const jwt = require("jsonwebtoken");
const db = require("../config/db");

const getTokenFromHandshake = (socket) => {
  const authToken =
    socket.handshake.auth?.token ||
    socket.handshake.query?.token ||
    socket.handshake.headers?.authorization;

  if (!authToken) return null;
  if (authToken.startsWith("Bearer ")) {
    return authToken.split(" ")[1];
  }
  return authToken;
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = getTokenFromHandshake(socket);
    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db
      .promise()
      .query(
        "SELECT id, name, email, user_photo FROM user WHERE id = ? LIMIT 1",
        [decoded.id]
      );

    if (!users.length) {
      return next(new Error("User not found"));
    }

    socket.user = users[0];
    return next();
  } catch (error) {
    return next(new Error("Authentication failed"));
  }
};

const registerNotificationSocket = (io) => {
    io.use(authenticateSocket);
    io.on("connection", (socket) => {
        console.log("Notification socket connected:", socket.id);

        // User joins his own room
        socket.on("join_notifications", (memberId) => {
        socket.join("member_" + memberId);
        console.log(`Member ${memberId} joined notifications room`);
        });
    });
};

module.exports = registerNotificationSocket;