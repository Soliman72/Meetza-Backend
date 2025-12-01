const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const baseSelect = `
  SELECT
    gm.id,
    gm.group_id,
    gm.sender_id,
    gm.message,
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

  return {
    ...message,
    media: mediaRows || [],
  };
};

// Save read status for all group members when a message is sent
const saveMessageReadStatus = async (messageId, groupId, senderId) => {
  try {
    // Get all members of the group (administrator + members)
    const [members] = await db.promise().query(
      `
        SELECT DISTINCT user_id
        FROM (
          SELECT member_id AS user_id FROM group_membership WHERE group_id = ?
        ) AS all_members
      `,
      [groupId]
    );

    if (!members || members.length === 0) {
      console.warn(`No members found for group ${groupId}`);
      return;
    }

    const now = new Date();
    const readStatusRecords = [];

    // Create read status records for each member
    for (const member of members) {
      const userId = member.user_id;
      const isRead = userId === senderId ? 1 : 0; // Sender has read status = 1, others = 0
      const readAt = userId === senderId ? now : null;

      const statusId = uuidv4();
      readStatusRecords.push({
        id: statusId,
        message_id: messageId,
        user_id: userId,
        is_read: isRead,
        read_at: readAt,
        created_at: now,
      });
    }

    // Insert all read status records in batch using ON DUPLICATE KEY UPDATE
    // to handle cases where record might already exist
    if (readStatusRecords.length > 0) {
      try {
        const values = readStatusRecords
          .map(() => "(?, ?, ?, ?, ?, ?)")
          .join(", ");
        const params = [];
        
        readStatusRecords.forEach((record) => {
          params.push(
            record.id,
            record.message_id,
            record.user_id,
            record.is_read,
            record.read_at,
            record.created_at
          );
        });

        await db.promise().query(
          `
            INSERT INTO message_read_status 
            (id, message_id, user_id, is_read, read_at, created_at) 
            VALUES ${values}
            ON DUPLICATE KEY UPDATE
              is_read = VALUES(is_read),
              read_at = VALUES(read_at),
              updated_at = VALUES(created_at)
          `,
          params
        );
      } catch (insertError) {
        // If batch insert fails, try inserting one by one
        console.warn("Batch insert failed, trying individual inserts:", insertError);
        for (const record of readStatusRecords) {
          try {
            await db.promise().query(
              `
                INSERT INTO message_read_status 
                (id, message_id, user_id, is_read, read_at, created_at) 
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  is_read = VALUES(is_read),
                  read_at = VALUES(read_at),
                  updated_at = VALUES(created_at)
              `,
              [
                record.id,
                record.message_id,
                record.user_id,
                record.is_read,
                record.read_at,
                record.created_at,
              ]
            );
          } catch (individualError) {
            console.error(
              `Error inserting read status for user ${record.user_id}, message ${messageId}:`,
              individualError
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error saving message read status:", error);
    // Don't throw error - message is already saved, read status is optional
  }
};

const saveMessage = async (groupId, senderId, message, media = null) => {
  const trimmed = (message || "").trim();

  const id = uuidv4();

  // Try to insert with media column, fallback if column doesn't exist
  await db
    .promise()
    .query(
      "INSERT INTO group_message (id, group_id, sender_id, message, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, groupId, senderId, trimmed, new Date()]
    );

  if (media) {
    for (const item of media) {
      await db
        .promise()
        .query(
          "INSERT INTO group_message_media (id, group_id, sender_id, media_url, media_type , message_id) VALUES (?, ?, ?, ?, ?, ?)",
          [
            item.id,
            item.group_id,
            item.sender_id,
            item.mediaUrl,
            item.mediaType,
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

  const messages = await Promise.all(
    rows.map(async (message) => {
      const [mediaRows] = await db
        .promise()
        .query("SELECT * FROM group_message_media WHERE message_id = ?", [
          message.id,
        ]);

      // Get read status for the user if userId is provided
      let isRead = false;
      let readAt = null;
      if (userId) {
        const [readStatus] = await db
          .promise()
          .query(
            "SELECT is_read, read_at FROM message_read_status WHERE message_id = ? AND user_id = ?",
            [message.id, userId]
          );
        if (readStatus.length > 0) {
          isRead = readStatus[0].is_read === 1;
          readAt = readStatus[0].read_at;
        }
      }

      return {
        ...message,
        media: mediaRows || [],
        is_read: isRead,
        read_at: readAt,
      };
    })
  );

  return messages.reverse();
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
const getReadMessages = async (groupId, userId, { limit = 50, before } = {}) => {
  const safeLimit = Math.min(Number(limit) || 50, 200);
  const params = [groupId, userId];
  let whereClause = "WHERE gm.group_id = ? AND mrs.user_id = ? AND mrs.is_read = 1";

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

  const messages = await Promise.all(
    rows.map(async (message) => {
      const [mediaRows] = await db
        .promise()
        .query("SELECT * FROM group_message_media WHERE message_id = ?", [
          message.id,
        ]);

      const [readStatus] = await db
        .promise()
        .query(
          "SELECT read_at FROM message_read_status WHERE message_id = ? AND user_id = ?",
          [message.id, userId]
        );

      return {
        ...message,
        media: mediaRows || [],
        is_read: true,
        read_at: readStatus[0]?.read_at || null,
      };
    })
  );

  return messages.reverse();
};

// Get unread messages for a user in a group
const getUnreadMessages = async (groupId, userId, { limit = 50, before } = {}) => {
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

  const messages = await Promise.all(
    rows.map(async (message) => {
      const [mediaRows] = await db
        .promise()
        .query("SELECT * FROM group_message_media WHERE message_id = ?", [
          message.id,
        ]);

      const [readStatus] = await db
        .promise()
        .query(
          "SELECT is_read, read_at FROM message_read_status WHERE message_id = ? AND user_id = ?",
          [message.id, userId]
        );

      return {
        ...message,
        media: mediaRows || [],
        is_read: readStatus.length > 0 ? readStatus[0].is_read === 1 : false,
        read_at: readStatus[0]?.read_at || null,
      };
    })
  );

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

module.exports = {
  saveMessage,
  getMessages,
  fetchMessageById,
  markMessageAsRead,
  markMessageAsUnread,
  markMessagesAsRead,
  getReadMessages,
  getUnreadMessages,
  getUnreadCount,
};
