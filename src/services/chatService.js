const { v4: uuidv4 } = require("uuid");
const validator = require("validator");
const chatRepository = require("../repositories/chatRepository");
const chatValidator = require("../validators/chatValidator");
const {
  saveMessage,
  getMessages,
  searchMessages,
  markMessageAsRead,
  markMessageAsUnread,
  markMessagesAsRead,
  getReadMessages,
  getUnreadMessages,
  getUnreadCount,
  toggleReaction,
  determineResourceCategory,
} = require("./chatMessageService");
const { ensureGroupAccess } = require("../utils/groupAccess");
const {
  upload,
  uploadToCloudinaryResources,
} = require("../middleware/uploadFile");
const { broadcastMessage, getChatIo } = require("./chatSocketService");

exports.getMyGroups = async (req) => {
  const userId = req.user?.id;
  chatValidator.requireUserId(userId);
  const userRole = await chatRepository.getUserRole(userId);
  const rows =
    userRole === "Super_Admin"
      ? await chatRepository.getMyGroupsSuperAdmin()
      : await chatRepository.getMyGroupsForUser(userId);
  return rows;
};

exports.getUnreadGroups = async (req) => {
  const userId = req.user?.id;
  chatValidator.requireUserId(userId);
  return chatRepository.getUnreadGroups(userId);
};

exports.getGroupMessages = async (req) => {
  const userId = req.user?.id;
  const { groupId } = req.params;
  const { limit, before, searchMessage } = req.query;
  chatValidator.requireGroupId(groupId);

  if (searchMessage !== undefined) {
    const trimmed = chatValidator.validateSearchMessage(searchMessage);
    await ensureGroupAccess(userId, groupId);
    return searchMessages(groupId, trimmed, { limit, userId });
  }

  await ensureGroupAccess(userId, groupId);
  return getMessages(groupId, { limit, before, userId });
};

exports.processSendMessageAfterUpload = async (req) => {
  const userId = req.user?.id;
  const { groupId } = req.params;
  const { message, parentMessageId } = req.body;
  chatValidator.requireGroupId(groupId);

  const messageText = (message || "").trim();
  const hasMedia = req.files?.media && req.files.media.length > 0;

  if (!messageText && !hasMedia) {
    const err = new Error("Either message text or media file is required");
    err.status = 400;
    throw err;
  }

  await ensureGroupAccess(userId, groupId);

  const uploadedMedia = [];

  if (
    validator.isURL(messageText, {
      require_protocol: true,
      protocols: ["http", "https"],
    })
  ) {
    uploadedMedia.push({
      id: uuidv4(),
      group_id: groupId,
      sender_id: userId,
      mediaUrl: messageText,
      mediaType: "link",
      fileName: messageText,
    });
  }

  if (hasMedia) {
    for (const file of req.files.media) {
      let mediaUrl;
      let mediaType = "file";
      let resourceType = "auto";
      const fileName = file.originalname;
      const mimeType = file.mimetype || "";

      if (mimeType.startsWith("image/")) {
        mediaType = "image";
        resourceType = "auto";
      } else if (
        mimeType.startsWith("audio/") ||
        mimeType.includes("voice") ||
        mimeType.includes("mpeg") ||
        mimeType.includes("wav") ||
        mimeType.includes("ogg")
      ) {
        mediaType = "voice";
        resourceType = "auto";
      } else if (mimeType.startsWith("video/")) {
        mediaType = "video";
        resourceType = "auto";
      } else {
        mediaType = "file";
        resourceType = "raw";
      }

      mediaUrl = await uploadToCloudinaryResources(
        file,
        "group_message_media",
        resourceType
      );

      if (mediaUrl) {
        uploadedMedia.push({
          id: uuidv4(),
          group_id: groupId,
          sender_id: userId,
          mediaUrl,
          mediaType,
          fileName,
        });
      }
    }
  }

  const savedMessage = await saveMessage(
    groupId,
    userId,
    messageText || "",
    uploadedMedia,
    parentMessageId || null
  );

  broadcastMessage(savedMessage);
  return savedMessage;
};

exports.deleteMessage = async (req) => {
  const userId = req.user?.id;
  const { groupId, messageId } = req.params;
  chatValidator.requireGroupAndMessageIds(groupId, messageId);

  const groupAccess = await ensureGroupAccess(userId, groupId);
  const membershipRole = groupAccess.membership_role;

  let whereClause = "";
  const params = [messageId, groupId];

  if (membershipRole === "Administrator" || membershipRole === "Super_Admin") {
    whereClause = "WHERE id = ? AND group_id = ?";
  } else if (membershipRole === "Member") {
    whereClause = "WHERE id = ? AND group_id = ? AND sender_id = ?";
    params.push(userId);
  } else {
    const err = new Error(
      "You do not have permission to delete messages in this group"
    );
    err.status = 403;
    throw err;
  }

  const affected = await chatRepository.deleteGroupMessage(whereClause, params);
  if (affected === 0) {
    const err = new Error(
      "Message not found or you are not authorized to delete it"
    );
    err.status = 404;
    throw err;
  }
};

exports.updateMessage = async (req) => {
  const userId = req.user?.id;
  const { groupId, messageId } = req.params;
  const { message } = req.body;
  chatValidator.requireGroupAndMessageIds(groupId, messageId);

  await ensureGroupAccess(userId, groupId);

  const affected = await chatRepository.updateGroupMessageText(
    message,
    messageId,
    userId,
    groupId
  );
  if (affected === 0) {
    const err = new Error("Message not found or you are not the sender");
    err.status = 404;
    throw err;
  }
  return chatRepository.getMessageById(messageId);
};

exports.getGroupInfo = async (req) => {
  const userId = req.user?.id;
  const { groupId } = req.params;
  chatValidator.requireGroupId(groupId);

  const group = await ensureGroupAccess(userId, groupId);
  const memberRows = await chatRepository.getGroupMembersForInfo(
    group.administrator_id,
    groupId
  );

  let content = null;
  const contentRow = await chatRepository.getFirstGroupContentRow(groupId);
  if (contentRow) {
    const resources = await chatRepository.getGroupContentResources(
      contentRow.id
    );
    content = {
      ...contentRow,
      resources: resources.map((resource) => ({
        ...resource,
        category: determineResourceCategory(resource.file_type),
      })),
    };
  }

  return { group, members: memberRows, content };
};

exports.getGroupMeetings = async (req) => {
  const userId = req.user?.id;
  const { groupId } = req.params;
  const { from, to } = req.query;
  chatValidator.requireGroupId(groupId);

  await ensureGroupAccess(userId, groupId);

  const params = [groupId];
  let whereClause = "WHERE group_id = ?";

  const fromDate = chatValidator.validateMeetingDate("from", from);
  if (fromDate) {
    whereClause += " AND start_time >= ?";
    params.push(fromDate);
  }
  const toDate = chatValidator.validateMeetingDate("to", to);
  if (toDate) {
    whereClause += " AND start_time <= ?";
    params.push(toDate);
  }

  return chatRepository.getMeetingsForGroup(whereClause, params);
};

exports.markMessageAsRead = async (req) => {
  const userId = req.user?.id;
  const { groupId, messageId } = req.params;
  chatValidator.requireGroupAndMessageIds(groupId, messageId);
  await ensureGroupAccess(userId, groupId);
  await markMessageAsRead(messageId, userId);

  const io = getChatIo();
  if (io) {
    const userName = await chatRepository.getUserName(userId);
    io.to(`group:${groupId}`).emit("messageRead", {
      messageId,
      userId,
      userName,
      readAt: new Date(),
    });
  }
};

exports.markMessageAsUnread = async (req) => {
  const userId = req.user?.id;
  const { groupId, messageId } = req.params;
  chatValidator.requireGroupAndMessageIds(groupId, messageId);
  await ensureGroupAccess(userId, groupId);
  await markMessageAsUnread(messageId, userId);

  const io = getChatIo();
  if (io) {
    const userName = await chatRepository.getUserName(userId);
    io.to(`group:${groupId}`).emit("messageUnread", {
      messageId,
      userId,
      userName,
    });
  }
};

exports.markAllMessagesAsRead = async (req) => {
  const userId = req.user?.id;
  const { groupId } = req.params;
  chatValidator.requireGroupId(groupId);
  await ensureGroupAccess(userId, groupId);

  const unreadMessages = await getUnreadMessages(groupId, userId, {
    limit: 1000,
  });
  const messageIds = unreadMessages.map((msg) => msg.id);

  if (messageIds.length > 0) {
    await markMessagesAsRead(messageIds, userId);
  }

  const io = getChatIo();
  if (io) {
    const userName = await chatRepository.getUserName(userId);
    io.to(`group:${groupId}`).emit("allMessagesRead", {
      userId,
      userName,
      messageCount: messageIds.length,
      readAt: new Date(),
    });
  }

  return messageIds.length;
};

exports.getReadMessages = async (req) => {
  const userId = req.user?.id;
  const { groupId } = req.params;
  const { limit, before } = req.query;
  chatValidator.requireGroupId(groupId);
  await ensureGroupAccess(userId, groupId);
  return getReadMessages(groupId, userId, { limit, before });
};

exports.getUnreadMessages = async (req) => {
  const userId = req.user?.id;
  const { groupId } = req.params;
  const { limit, before } = req.query;
  chatValidator.requireGroupId(groupId);
  await ensureGroupAccess(userId, groupId);
  return getUnreadMessages(groupId, userId, { limit, before });
};

exports.getUnreadCount = async (req) => {
  const userId = req.user?.id;
  const { groupId } = req.params;
  chatValidator.requireGroupId(groupId);
  await ensureGroupAccess(userId, groupId);
  return getUnreadCount(groupId, userId);
};

exports.toggleReaction = async (req) => {
  const userId = req.user?.id;
  const { groupId, messageId } = req.params;
  const cleanEmoji = chatValidator.validateEmoji(req.body?.emoji);
  chatValidator.requireGroupAndMessageIds(groupId, messageId);

  await ensureGroupAccess(userId, groupId);

  const { reactions, action } = await toggleReaction(
    messageId,
    userId,
    cleanEmoji
  );

  const userReacted = await chatRepository.getUserForReaction(userId);

  const io = getChatIo();
  if (io) {
    io.to(`group:${groupId}`).emit("messageReactionUpdated", {
      groupId,
      messageId,
      reactions,
      action,
      userId,
      user: userReacted,
      emoji: cleanEmoji,
    });
  }

  return { messageId, reactions, action, user: userReacted };
};

exports.getUploadMiddlewareForSendMessage = () =>
  upload.fields([{ name: "media", maxCount: 10 }]);
