const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

/**
 * Returns a map of { [messageId]: reactionGroups[] } for the given message IDs.
 * reactionGroups: { emoji, count, users: [userId, ...] }
 */
exports.fetchReactionsForMessages = async (messageIds) => {
  if (!messageIds || messageIds.length === 0) return {};

  const [rows] = await db.promise().query(
    `SELECT message_id, emoji, user_id
     FROM message_reaction
     WHERE message_id IN (?)`,
    [messageIds]
  );

  // Group by messageId → emoji → users
  const map = {};
  for (const row of rows) {
    if (!map[row.message_id]) map[row.message_id] = {};
    if (!map[row.message_id][row.emoji]) map[row.message_id][row.emoji] = [];
    map[row.message_id][row.emoji].push(row.user_id);
  }

  // Convert inner map to array form
  const result = {};
  for (const msgId of Object.keys(map)) {
    result[msgId] = Object.entries(map[msgId]).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      users,
    }));
  }
  return result;
};

/**
 * Toggle a reaction: if the user already reacted with this emoji on this
 * message, remove it; if reacted with a different emoji, update it; otherwise add it.
 * Returns the updated reactions array for the message.
 */
exports.toggleReaction = async (messageId, userId, emoji) => {
  let action = "";
  // Check if any reaction already exists for this user and message
  const [existing] = await db.promise().query(
    "SELECT id, emoji FROM message_reaction WHERE message_id = ? AND user_id = ?",
    [messageId, userId]
  );

  if (existing.length > 0) {
    if (existing[0].emoji === emoji) {
      // Remove reaction if it's the exact same emoji (toggle off)
      await db.promise().query(
        "DELETE FROM message_reaction WHERE id = ?",
        [existing[0].id]
      );
      action = "removed";
    } else {
      // Update reaction to the new emoji
      await db.promise().query(
        "UPDATE message_reaction SET emoji = ? WHERE id = ?",
        [emoji, existing[0].id]
      );
      action = "updated";
    }
  } else {
    // Add new reaction
    const id = uuidv4();
    await db.promise().query(
      "INSERT INTO message_reaction (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)",
      [id, messageId, userId, emoji]
    );
    action = "added";
  }

  // Return updated reactions for this message along with the action performed
  const reactionsMap = await exports.fetchReactionsForMessages([messageId]);
  return {
    reactions: reactionsMap[messageId] || [],
    action,
  };
};

/**
 * Get all reactions for a single message.
 */
exports.getReactions = async (messageId) => {
  const reactionsMap = await exports.fetchReactionsForMessages([messageId]);
  return reactionsMap[messageId] || [];
};
