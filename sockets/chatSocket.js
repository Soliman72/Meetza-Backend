const jwt = require("jsonwebtoken");
const db = require("../config/db");
const {
  saveMessage,
  markMessageAsRead,
  markMessageAsUnread,
  markMessagesAsRead,
  getUnreadCount,
} = require("../services/chatMessageService");
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

    // Mark message as read via socket
    socket.on("markMessageRead", async (payload = {}, ack) => {
      try {
        const { groupId, messageId } = payload;
        if (!groupId || !messageId) {
          throw new Error("groupId and messageId are required");
        }

        await ensureGroupAccess(socket.user.id, groupId);
        await markMessageAsRead(messageId, socket.user.id);

        // Notify others in the group that this message was read
        io.to(`group:${groupId}`).emit("messageRead", {
          messageId,
          userId: socket.user.id,
          userName: socket.user.name,
          readAt: new Date(),
        });

        // Get updated unread count for the user
        const unreadCount = await getUnreadCount(groupId, socket.user.id);

        if (typeof ack === "function") {
          ack({ ok: true, unreadCount });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Mark message as unread via socket
    socket.on("markMessageUnread", async (payload = {}, ack) => {
      try {
        const { groupId, messageId } = payload;
        if (!groupId || !messageId) {
          throw new Error("groupId and messageId are required");
        }

        await ensureGroupAccess(socket.user.id, groupId);
        await markMessageAsUnread(messageId, socket.user.id);

        // Notify others in the group that this message was marked unread
        io.to(`group:${groupId}`).emit("messageUnread", {
          messageId,
          userId: socket.user.id,
          userName: socket.user.name,
        });

        // Get updated unread count for the user
        const unreadCount = await getUnreadCount(groupId, socket.user.id);

        if (typeof ack === "function") {
          ack({ ok: true, unreadCount });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Mark all messages in a group as read via socket
    socket.on("markAllMessagesRead", async (payload = {}, ack) => {
      try {
        const { groupId } = payload;
        if (!groupId) {
          throw new Error("groupId is required");
        }

        await ensureGroupAccess(socket.user.id, groupId);

        // Get all unread message IDs
        const { getUnreadMessages } = require("../services/chatMessageService");
        const unreadMessages = await getUnreadMessages(groupId, socket.user.id, {
          limit: 1000,
        });
        const messageIds = unreadMessages.map((msg) => msg.id);

        if (messageIds.length > 0) {
          await markMessagesAsRead(messageIds, socket.user.id);
        }

        // Notify others in the group
        io.to(`group:${groupId}`).emit("allMessagesRead", {
          userId: socket.user.id,
          userName: socket.user.name,
          messageCount: messageIds.length,
          readAt: new Date(),
        });

        // Get updated unread count
        const unreadCount = await getUnreadCount(groupId, socket.user.id);

        if (typeof ack === "function") {
          ack({ ok: true, unreadCount, messageCount: messageIds.length });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Get unread count for a group
    socket.on("getUnreadCount", async (payload = {}, ack) => {
      try {
        const { groupId } = payload;
        if (!groupId) {
          throw new Error("groupId is required");
        }

        await ensureGroupAccess(socket.user.id, groupId);
        const count = await getUnreadCount(groupId, socket.user.id);

        if (typeof ack === "function") {
          ack({ ok: true, unreadCount: count });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Chat socket disconnected:", socket.id);
    });
  });
};

module.exports = registerChatSocket;
