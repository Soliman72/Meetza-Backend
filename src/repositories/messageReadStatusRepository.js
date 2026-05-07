const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

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

// Save read status for all group members when a message is sent
exports.saveMessageReadStatus = async (messageId, groupId, senderId) => {
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
  }
};

// Mark message as read for a user
exports.markMessageAsRead = async (messageId, userId) => {
  try {
    const [existing] = await db
      .promise()
      .query(
        "SELECT id FROM message_read_status WHERE message_id = ? AND user_id = ?",
        [messageId, userId]
      );

    if (existing.length > 0) {
      await db
        .promise()
        .query(
          "UPDATE message_read_status SET is_read = 1, read_at = ? WHERE message_id = ? AND user_id = ?",
          [new Date(), messageId, userId]
        );
    } else {
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
exports.markMessageAsUnread = async (messageId, userId) => {
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

// Mark multiple messages as read
exports.markMessagesAsRead = async (messageIds, userId) => {
  try {
    if (!messageIds || messageIds.length === 0) {
      return { success: true, affectedRows: 0 };
    }
    const now = new Date();
    const values = messageIds.map((msgId) => [
      uuidv4(),
      msgId,
      userId,
      1,
      now,
    ]);
    await db.promise().query(
      `INSERT INTO message_read_status (id, message_id, user_id, is_read, read_at) 
       VALUES ? 
       ON DUPLICATE KEY UPDATE is_read = 1, read_at = VALUES(read_at)`,
      [values]
    );
    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};

// Get read messages for a user in a group
exports.getReadMessages = async (
  groupId,
  userId,
  { limit = 50, before } = {},
  fetchReactionsForMessages,
  fetchParentMessages,
  mediaByMessageId
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

  const [allReadStatus] = await db.promise().query(
    "SELECT message_id, read_at FROM message_read_status WHERE user_id = ? AND message_id IN (?)",
    [userId, messageIds]
  );
  const readStatusesByMessageId = allReadStatus.reduce((acc, status) => {
    acc[status.message_id] = status;
    return acc;
  }, {});

  const reactionsByMessageId = await fetchReactionsForMessages(messageIds);
  const parentMessageMap = await fetchParentMessages(rows);

  const messages = rows.map((message) => {
    return {
      ...message,
      media: mediaByMessageId ? (mediaByMessageId[message.id] || []) : [],
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
exports.getUnreadMessages = async (
  groupId,
  userId,
  { limit = 50, before } = {},
  fetchReactionsForMessages,
  fetchParentMessages,
  mediaByMessageId
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

  const [allReadStatus] = await db.promise().query(
    "SELECT message_id, is_read, read_at FROM message_read_status WHERE user_id = ? AND message_id IN (?)",
    [userId, messageIds]
  );
  const readStatusesByMessageId = allReadStatus.reduce((acc, status) => {
    acc[status.message_id] = status;
    return acc;
  }, {});

  const reactionsByMessageId = await fetchReactionsForMessages(messageIds);
  const parentMessageMap = await fetchParentMessages(rows);

  const messages = rows.map((message) => {
    const status = readStatusesByMessageId[message.id];
    return {
      ...message,
      media: mediaByMessageId ? (mediaByMessageId[message.id] || []) : [],
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
exports.getUnreadCount = async (groupId, userId) => {
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

// SQL + param factory for total unread messages
exports.buildUnreadTotalQuery = (role) => {
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
