const repo = require("../repositories/chatMessageRepository");
const {
  normalizeLimit,
  normalizeBefore,
  normalizeMessage,
  normalizeEmoji,
} = require("../utils/chatMessageNormalize");

const saveMessage = async (groupId, senderId, message, media = null, parentMessageId = null) => {
  const msg = normalizeMessage(message);
  return repo.saveMessage(groupId, senderId, msg, media, parentMessageId);
};

const getMessages = async (groupId, { limit = 50, before, userId } = {}) => {
  return repo.getMessages(groupId, {
    limit: normalizeLimit(limit, 50, 200),
    before: normalizeBefore(before),
    userId,
  });
};

const searchMessages = async (groupId, query, { limit = 50, userId } = {}) => {
  const q = String(query || "").trim();
  if (!q) {
    const e = new Error("Search query is required");
    e.status = 400;
    throw e;
  }
  return repo.searchMessages(groupId, q, {
    limit: normalizeLimit(limit, 50, 200),
    userId,
  });
};

const fetchMessageById = async (id) => repo.fetchMessageById(id);

const markMessageAsRead = async (messageId, userId) =>
  repo.markMessageAsRead(messageId, userId);

const markMessageAsUnread = async (messageId, userId) =>
  repo.markMessageAsUnread(messageId, userId);

const markMessagesAsRead = async (messageIds, userId) =>
  repo.markMessagesAsRead(messageIds, userId);

const getReadMessages = async (groupId, userId, { limit = 50, before } = {}) =>
  repo.getReadMessages(groupId, userId, {
    limit: normalizeLimit(limit, 50, 200),
    before: normalizeBefore(before),
  });

const getUnreadMessages = async (groupId, userId, { limit = 50, before } = {}) =>
  repo.getUnreadMessages(groupId, userId, {
    limit: normalizeLimit(limit, 50, 200),
    before: normalizeBefore(before),
  });

const getUnreadCount = async (groupId, userId) =>
  repo.getUnreadCount(groupId, userId);

const buildUnreadTotalQuery = (role) => repo.buildUnreadTotalQuery(role);

const toggleReaction = async (messageId, userId, emoji) =>
  repo.toggleReaction(messageId, userId, normalizeEmoji(emoji));

const getReactions = async (messageId) => repo.getReactions(messageId);

function determineResourceCategory(fileType = "") {
  if (!fileType) return "other";
  if (fileType.startsWith("image/")) return "photos";
  if (fileType.startsWith("video/")) return "videos";
  if (fileType.includes("pdf") || fileType.includes("document")) return "documents";
  if (fileType.includes("presentation") || fileType.includes("ms-powerpoint")) return "documents";
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "documents";
  if (fileType.includes("audio/")) return "audio";
  if (fileType.includes("link")) return "links";
  return "other";
}

module.exports = {
  saveMessage,
  getMessages,
  searchMessages,
  fetchMessageById,
  markMessageAsRead,
  markMessageAsUnread,
  markMessagesAsRead,
  getReadMessages,
  getUnreadMessages,
  getUnreadCount,
  buildUnreadTotalQuery,
  toggleReaction,
  getReactions,
  determineResourceCategory,
};
