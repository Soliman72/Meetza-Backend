const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const baseSelect = `
  SELECT
    gm.id,
    gm.group_id,
    gm.sender_id,
    gm.message,
    gm.parent_message_id,
    gm.created_at,
    u.name AS sender_name,
    u.email AS sender_email,
    u.user_photo AS sender_photo
  FROM group_message gm
  JOIN user u ON u.id = gm.sender_id
`;

const fetchMessageById = async (id) => {
  const [rows] = await db
    .promise()
    .query(`${baseSelect} WHERE gm.id = ?`, [id]);

  if (!rows[0]) return null;

  const message = rows[0];

  const [mediaRows] = await db
    .promise()
    .query("SELECT * FROM group_message_media WHERE message_id = ?", [id]);

  // Fetch reactions
  const reactions = await fetchReactionsForMessages([id]);

  // Fetch parent message preview if it's a reply
  let parentMessage = null;
  if (message.parent_message_id) {
    const [parentRows] = await db.promise().query(
      `SELECT gm.id, gm.message, gm.parent_message_id, u.name AS sender_name, u.user_photo AS sender_photo
       FROM group_message gm
       JOIN user u ON u.id = gm.sender_id
       WHERE gm.id = ?`,
      [message.parent_message_id]
    );
    parentMessage = parentRows[0] || null;
  }

  return {
    ...message,
    media: mediaRows || [],
    reactions: reactions[id] || [],
    parent_message: parentMessage,
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a map of { [messageId]: reactionGroups[] } for the given message IDs.
 * reactionGroups: { emoji, count, users: [userId, ...] }
 */
const fetchReactionsForMessages = async (messageIds) => {
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
 * Returns a map of { [messageId]: parentMessagePreview } for messages that have
 * a parent_message_id set.
 */
const fetchParentMessages = async (rows) => {
  const parentIds = [...new Set(
    rows.map((r) => r.parent_message_id).filter(Boolean)
  )];
  if (parentIds.length === 0) return {};

  const [parentRows] = await db.promise().query(
    `SELECT gm.id, gm.message, gm.parent_message_id, u.name AS sender_name, u.user_photo AS sender_photo
     FROM group_message gm
     JOIN user u ON u.id = gm.sender_id
     WHERE gm.id IN (?)`,
    [parentIds]
  );

  return parentRows.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
};

// Save read status for all group members when a message is sent
const saveMessageReadStatus = async (messageId, groupId, senderId) => {
  try {
    // Get all participants of the group (group_admins + members)
    const [participants] = await db.promise().query(
      `
        SELECT DISTINCT user_id
        FROM (
          SELECT member_id AS user_id FROM group_membership WHERE group_id = ?
          UNION
          SELECT user_id FROM group_admin WHERE group_id = ?
        ) AS all_participants
      `,
      [groupId, groupId]
    );

    if (!participants || participants.length === 0) {
      console.warn(`No participants found for group ${groupId}`);
      return;
    }

    const now = new Date();
    
    // Create status records for each participant
    const values = participants.map((p) => [
      uuidv4(),
      messageId,
      p.user_id,
      p.user_id === senderId ? 1 : 0,
      p.user_id === senderId ? now : null
    ]);

    // Bulk insert read status records
    await db.promise().query(
      `INSERT INTO message_read_status (id, message_id, user_id, is_read, read_at) VALUES ?`,
      [values]
    );
  } catch (error) {
    console.error("Error saving message read status:", error);
    // Don't throw error - message is already saved, read status is optional
  }
};


const saveMessage = async (groupId, senderId, message, media = null, parentMessageId = null) => {
  const trimmed = (message || "").trim();

  const id = uuidv4();

  await db
    .promise()
    .query(
      "INSERT INTO group_message (id, group_id, sender_id, message, parent_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, groupId, senderId, trimmed, parentMessageId || null, new Date()]
    );

  if (media) {
    for (const item of media) {
      await db
        .promise()
        .query(
          "INSERT INTO group_message_media (id, group_id, sender_id, media_url, media_type, file_name, message_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            item.id,
            item.group_id,
            item.sender_id,
            item.mediaUrl,
            item.mediaType,
            item.fileName,
            id,
          ]
        );
    }
  }

  // Save read status for all group members
  await saveMessageReadStatus(id, groupId, senderId);

  return fetchMessageById(id);
};

const getMessages = async (groupId, { limit = 50, before, userId } = {}) => {
  const safeLimit = Math.min(Number(limit) || 50, 200);
  const params = [groupId];
  let whereClause = "WHERE gm.group_id = ?";

  if (before) {
    const beforeDate = new Date(before);
    if (Number.isNaN(beforeDate.getTime())) {
      throw new Error("Invalid 'before' timestamp");
    }
    whereClause += " AND gm.created_at < ?";
    params.push(beforeDate);
  }

  params.push(safeLimit);

  const [rows] = await db.promise().query(
    `
        ${baseSelect}
        ${whereClause}
        ORDER BY gm.created_at DESC
        LIMIT ?
      `,
    params
  );

  if (rows.length === 0) return [];

  const messageIds = rows.map((m) => m.id);

  // Fetch all media for these messages in a single query
  const [allMedia] = await db
    .promise()
    .query("SELECT * FROM group_message_media WHERE message_id IN (?)", [messageIds]);

  const mediaByMessageId = allMedia.reduce((acc, media) => {
    if (!acc[media.message_id]) acc[media.message_id] = [];
    acc[media.message_id].push(media);
    return acc;
  }, {});

  // Fetch all read statuses for these messages if userId is provided
  let readStatusesByMessageId = {};
  if (userId) {
    const [allReadStatus] = await db.promise().query(
      "SELECT message_id, is_read, read_at FROM message_read_status WHERE user_id = ? AND message_id IN (?)",
      [userId, messageIds]
    );
    readStatusesByMessageId = allReadStatus.reduce((acc, status) => {
      acc[status.message_id] = status;
      return acc;
    }, {});
  }

  // Fetch reactions and parent messages in bulk
  const reactionsByMessageId = await fetchReactionsForMessages(messageIds);
  const parentMessageMap = await fetchParentMessages(rows);

  const messages = rows.map((message) => {
    const status = readStatusesByMessageId[message.id];
    return {
      ...message,
      media: mediaByMessageId[message.id] || [],
      reactions: reactionsByMessageId[message.id] || [],
      parent_message: message.parent_message_id
        ? (parentMessageMap[message.parent_message_id] || null)
        : null,
      is_read: status ? status.is_read === 1 : false,
      read_at: status ? status.read_at : null,
    };
  });

  return messages.reverse();
};

/**
 * Search messages within a specific group by message text.
 */
const searchMessages = async (groupId, query, { limit = 50, userId } = {}) => {
  const safeLimit = Math.min(Number(limit) || 50, 200);
  const searchParam = query.trim();

  const [rows] = await db.promise().query(
    `${baseSelect}
     WHERE gm.group_id = ?
       AND gm.message LIKE CONCAT('%', ?, '%')
     ORDER BY gm.created_at ASC
     LIMIT ?`,
    [groupId, searchParam, safeLimit]
  );

  if (rows.length === 0) return [];

  const messageIds = rows.map((m) => m.id);

  const [allMedia] = await db.promise().query(
    "SELECT * FROM group_message_media WHERE message_id IN (?)",
    [messageIds]
  );
  const mediaByMessageId = allMedia.reduce((acc, media) => {
    if (!acc[media.message_id]) acc[media.message_id] = [];
    acc[media.message_id].push(media);
    return acc;
  }, {});

  let readStatusesByMessageId = {};
  if (userId) {
    const [allReadStatus] = await db.promise().query(
      "SELECT message_id, is_read, read_at FROM message_read_status WHERE user_id = ? AND message_id IN (?)",
      [userId, messageIds]
    );
    readStatusesByMessageId = allReadStatus.reduce((acc, s) => {
      acc[s.message_id] = s;
      return acc;
    }, {});
  }

  const reactionsByMessageId = await fetchReactionsForMessages(messageIds);
  const parentMessageMap = await fetchParentMessages(rows);

  return rows.map((message) => {
    const status = readStatusesByMessageId[message.id];
    return {
      ...message,
      media: mediaByMessageId[message.id] || [],
      reactions: reactionsByMessageId[message.id] || [],
      parent_message: message.parent_message_id
        ? (parentMessageMap[message.parent_message_id] || null)
        : null,
      is_read: status ? status.is_read === 1 : false,
      read_at: status ? status.read_at : null,
    };
  });
};

// Mark message as read for a user
const markMessageAsRead = async (messageId, userId) => {
  try {
    // Check if read status already exists
    const [existing] = await db
      .promise()
      .query(
        "SELECT id FROM message_read_status WHERE message_id = ? AND user_id = ?",
        [messageId, userId]
      );

    if (existing.length > 0) {
      // Update existing record
      await db
        .promise()
        .query(
          "UPDATE message_read_status SET is_read = 1, read_at = ? WHERE message_id = ? AND user_id = ?",
          [new Date(), messageId, userId]
        );
    } else {
      // Insert new record
      const id = uuidv4();
      await db
        .promise()
        .query(
          "INSERT INTO message_read_status (id, message_id, user_id, is_read, read_at) VALUES (?, ?, ?, 1, ?)",
          [id, messageId, userId, new Date()]
        );
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

// Mark message as unread for a user
const markMessageAsUnread = async (messageId, userId) => {
  try {
    await db
      .promise()
      .query(
        "UPDATE message_read_status SET is_read = 0, read_at = NULL WHERE message_id = ? AND user_id = ?",
        [messageId, userId]
      );

    return { success: true };
  } catch (error) {
    console.error("Error marking message as unread:", error);
    throw error;
  }
};

// Mark multiple messages as read (for marking all messages in a group as read)
const markMessagesAsRead = async (messageIds, userId) => {
  try {
    if (!messageIds || messageIds.length === 0) {
      return { success: true, affectedRows: 0 };
    }

    // Insert or update for each message individually to handle UUIDs properly
    for (const msgId of messageIds) {
      const [existing] = await db
        .promise()
        .query(
          "SELECT id FROM message_read_status WHERE message_id = ? AND user_id = ?",
          [msgId, userId]
        );

      if (existing.length > 0) {
        // Update existing record
        await db
          .promise()
          .query(
            "UPDATE message_read_status SET is_read = 1, read_at = ? WHERE message_id = ? AND user_id = ?",
            [new Date(), msgId, userId]
          );
      } else {
        // Insert new record
        const id = uuidv4();
        await db
          .promise()
          .query(
            "INSERT INTO message_read_status (id, message_id, user_id, is_read, read_at) VALUES (?, ?, ?, 1, ?)",
            [id, msgId, userId, new Date()]
          );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};

// Get read messages for a user in a group
const getReadMessages = async (
  groupId,
  userId,
  { limit = 50, before } = {}
) => {
  const safeLimit = Math.min(Number(limit) || 50, 200);
  const params = [groupId, userId];
  let whereClause =
    "WHERE gm.group_id = ? AND mrs.user_id = ? AND mrs.is_read = 1";

  if (before) {
    const beforeDate = new Date(before);
    if (Number.isNaN(beforeDate.getTime())) {
      throw new Error("Invalid 'before' timestamp");
    }
    whereClause += " AND gm.created_at < ?";
    params.push(beforeDate);
  }

  params.push(safeLimit);

  const [rows] = await db.promise().query(
    `
        ${baseSelect}
        JOIN message_read_status mrs ON mrs.message_id = gm.id
        ${whereClause}
        ORDER BY gm.created_at DESC
        LIMIT ?
      `,
    params
  );

  if (rows.length === 0) return [];

  const messageIds = rows.map((m) => m.id);

  // Fetch all media in bulk
  const [allMedia] = await db
    .promise()
    .query("SELECT * FROM group_message_media WHERE message_id IN (?)", [messageIds]);

  const mediaByMessageId = allMedia.reduce((acc, media) => {
    if (!acc[media.message_id]) acc[media.message_id] = [];
    acc[media.message_id].push(media);
    return acc;
  }, {});

  // Fetch read status for this specific user in bulk
  const [allReadStatus] = await db.promise().query(
    "SELECT message_id, read_at FROM message_read_status WHERE user_id = ? AND message_id IN (?)",
    [userId, messageIds]
  );
  const readStatusesByMessageId = allReadStatus.reduce((acc, status) => {
    acc[status.message_id] = status;
    return acc;
  }, {});

  // Fetch reactions and parent messages in bulk
  const reactionsByMessageId = await fetchReactionsForMessages(messageIds);
  const parentMessageMap = await fetchParentMessages(rows);

  const messages = rows.map((message) => {
    return {
      ...message,
      media: mediaByMessageId[message.id] || [],
      reactions: reactionsByMessageId[message.id] || [],
      parent_message: message.parent_message_id
        ? (parentMessageMap[message.parent_message_id] || null)
        : null,
      is_read: true,
      read_at: readStatusesByMessageId[message.id]?.read_at || null,
    };
  });

  return messages.reverse();
};

// Get unread messages for a user in a group
const getUnreadMessages = async (
  groupId,
  userId,
  { limit = 50, before } = {}
) => {
  const safeLimit = Math.min(Number(limit) || 50, 200);
  const params = [groupId, userId];
  let whereClause = `
    WHERE gm.group_id = ? 
    AND gm.sender_id != ?
    AND (
      NOT EXISTS (
        SELECT 1 FROM message_read_status mrs 
        WHERE mrs.message_id = gm.id AND mrs.user_id = ?
      )
      OR EXISTS (
        SELECT 1 FROM message_read_status mrs 
        WHERE mrs.message_id = gm.id AND mrs.user_id = ? AND mrs.is_read = 0
      )
    )
  `;
  params.push(userId, userId);

  if (before) {
    const beforeDate = new Date(before);
    if (Number.isNaN(beforeDate.getTime())) {
      throw new Error("Invalid 'before' timestamp");
    }
    whereClause += " AND gm.created_at < ?";
    params.push(beforeDate);
  }

  params.push(safeLimit);

  const [rows] = await db.promise().query(
    `
        ${baseSelect}
        ${whereClause}
        ORDER BY gm.created_at DESC
        LIMIT ?
      `,
    params
  );

  if (rows.length === 0) return [];

  const messageIds = rows.map((m) => m.id);

  // Fetch all media in bulk
  const [allMedia] = await db
    .promise()
    .query("SELECT * FROM group_message_media WHERE message_id IN (?)", [messageIds]);

  const mediaByMessageId = allMedia.reduce((acc, media) => {
    if (!acc[media.message_id]) acc[media.message_id] = [];
    acc[media.message_id].push(media);
    return acc;
  }, {});

  // Fetch read status in bulk
  const [allReadStatus] = await db.promise().query(
    "SELECT message_id, is_read, read_at FROM message_read_status WHERE user_id = ? AND message_id IN (?)",
    [userId, messageIds]
  );
  const readStatusesByMessageId = allReadStatus.reduce((acc, status) => {
    acc[status.message_id] = status;
    return acc;
  }, {});

  // Fetch reactions and parent messages in bulk
  const reactionsByMessageId = await fetchReactionsForMessages(messageIds);
  const parentMessageMap = await fetchParentMessages(rows);

  const messages = rows.map((message) => {
    const status = readStatusesByMessageId[message.id];
    return {
      ...message,
      media: mediaByMessageId[message.id] || [],
      reactions: reactionsByMessageId[message.id] || [],
      parent_message: message.parent_message_id
        ? (parentMessageMap[message.parent_message_id] || null)
        : null,
      is_read: status ? status.is_read === 1 : false,
      read_at: status ? status.read_at : null,
    };
  });

  return messages.reverse();
};

// Get unread count for a user in a group
const getUnreadCount = async (groupId, userId) => {
  const [rows] = await db.promise().query(
    `
      SELECT COUNT(*) AS unread_count
      FROM group_message gm
      WHERE gm.group_id = ?
        AND gm.sender_id != ?
        AND (
          NOT EXISTS (
            SELECT 1 FROM message_read_status mrs 
            WHERE mrs.message_id = gm.id AND mrs.user_id = ?
          )
          OR EXISTS (
            SELECT 1 FROM message_read_status mrs 
            WHERE mrs.message_id = gm.id AND mrs.user_id = ? AND mrs.is_read = 0
          )
        )
    `,
    [groupId, userId, userId, userId]
  );

  return rows[0]?.unread_count || 0;
};

/**
 * SQL + param factory for total unread messages (home dashboard).
 * Matches getUnreadCount logic; Super_Admin: all groups; others: admin or membership groups only.
 */
const buildUnreadTotalQuery = (role) => {
  const unreadCondition = `
    gm.sender_id != ?
    AND (
      NOT EXISTS (
        SELECT 1 FROM message_read_status mrs
        WHERE mrs.message_id = gm.id AND mrs.user_id = ?
      )
      OR EXISTS (
        SELECT 1 FROM message_read_status mrs
        WHERE mrs.message_id = gm.id AND mrs.user_id = ? AND mrs.is_read = 0
      )
    )
  `;
  if (role === "Super_Admin") {
    return {
      sql: `SELECT COUNT(*) AS c FROM group_message gm WHERE ${unreadCondition}`,
      params: (userId) => [userId, userId, userId],
    };
  }
  return {
    sql: `
      SELECT COUNT(*) AS c
      FROM group_message gm
      WHERE ${unreadCondition}
        AND gm.group_id IN (
          SELECT g.id FROM \`group\` g
          WHERE EXISTS (
            SELECT 1 FROM group_admin ga
            WHERE ga.group_id = g.id AND ga.user_id = ?
          )
          OR EXISTS (
            SELECT 1 FROM group_membership gm2
            WHERE gm2.group_id = g.id AND gm2.member_id = ?
          )
        )
    `,
    params: (userId) => [userId, userId, userId, userId, userId],
  };
};

// ─── Reactions ────────────────────────────────────────────────────────────────

/**
 * Toggle a reaction: if the user already reacted with this emoji on this
 * message, remove it; if reacted with a different emoji, update it; otherwise add it.
 * Returns the updated reactions array for the message.
 */
const toggleReaction = async (messageId, userId, emoji) => {
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
  const reactionsMap = await fetchReactionsForMessages([messageId]);
  return {
    reactions: reactionsMap[messageId] || [],
    action,
  };
};

/**
 * Get all reactions for a single message.
 */
const getReactions = async (messageId) => {
  const reactionsMap = await fetchReactionsForMessages([messageId]);
  return reactionsMap[messageId] || [];
};

function determineResourceCategory(fileType = "") {
  if (!fileType) return "other";
  if (fileType.startsWith("image/")) return "photos";
  if (fileType.startsWith("video/")) return "videos";
  if (fileType.includes("pdf") || fileType.includes("document"))
    return "documents";
  if (fileType.includes("presentation") || fileType.includes("ms-powerpoint"))
    return "documents";
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return "documents";
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
