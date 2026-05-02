const {
  saveMessage,
  markMessageAsRead,
  markMessageAsUnread,
  markMessagesAsRead,
  getUnreadCount,
  toggleReaction,
} = require("../services/chatMessageService");
const { ensureGroupAccess } = require("../utils/groupAccess");

const registerChatSocket = (io) => {
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
        const { groupId, message, parentMessageId } = payload;
        if (!groupId) {
          throw new Error("groupId is required");
        }

        await ensureGroupAccess(socket.user.id, groupId);
        const savedMessage = await saveMessage(
          groupId,
          socket.user.id,
          message,
          null, // no media via socket
          parentMessageId || null
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

    // React to a message (toggle)
    socket.on("reactToMessage", async (payload = {}, ack) => {
      try {
        const { groupId, messageId, emoji } = payload;
        if (!groupId || !messageId || !emoji) {
          throw new Error("groupId, messageId, and emoji are required");
        }

        await ensureGroupAccess(socket.user.id, groupId);

        const cleanEmoji = String(emoji).trim().slice(0, 20);
        const { reactions, action } = await toggleReaction(messageId, socket.user.id, cleanEmoji);

        // Broadcast updated reactions to all clients in the group
        io.to(`group:${groupId}`).emit("messageReactionUpdated", {
          groupId,
          messageId,
          reactions,
          action,
          userId: socket.user.id,
          user: socket.user,
          emoji: cleanEmoji
        });

        if (typeof ack === "function") {
          ack({ ok: true, data: { messageId, reactions, action, user: socket.user } });
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
