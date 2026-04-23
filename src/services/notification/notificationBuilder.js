const { v4: uuidv4 } = require("uuid");

/**
 * Normalizes in-app notification payload before persistence and socket emit.
 */
exports.buildNotification = ({
  senderId,
  memberId,
  title,
  message,
  type,
}) => ({
  id: uuidv4(),
  memberId,
  senderId,
  title,
  message,
  type: type || "GENERAL",
});
