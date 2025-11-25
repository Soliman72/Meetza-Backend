const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { saveMessage } = require("../services/chatMessageService");
const { ensureGroupAccess } = require("../utils/groupAccess");

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

const registerChatSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.on("joinGroup", async (payload = {}, ack) => {
      try {
        const groupId = payload.groupId || payload;
        if (!groupId) {
          throw new Error("groupId is required");
        }

        await ensureGroupAccess(socket.user.id, groupId);
        socket.join(`group:${groupId}`);

        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on("leaveGroup", (payload = {}) => {
      const groupId = payload.groupId || payload;
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    });

    socket.on("sendMessage", async (payload = {}, ack) => {
      try {
        const { groupId, message } = payload;
        if (!groupId) {
          throw new Error("groupId is required");
        }

        await ensureGroupAccess(socket.user.id, groupId);
        const savedMessage = await saveMessage(
          groupId,
          socket.user.id,
          message
        );
        io.to(`group:${groupId}`).emit("message", savedMessage);

        if (typeof ack === "function") {
          ack({ ok: true, data: savedMessage });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });
  });
};

module.exports = registerChatSocket;
