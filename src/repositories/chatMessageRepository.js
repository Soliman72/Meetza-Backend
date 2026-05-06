const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const messageReactionRepository = require("./messageReactionRepository");
const messageReadStatusRepository = require("./messageReadStatusRepository");

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
  const reactions = await messageReactionRepository.fetchReactionsForMessages([id]);

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
  await messageReadStatusRepository.saveMessageReadStatus(id, groupId, senderId);

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

  const [allMedia] = await db
    .promise()
    .query("SELECT * FROM group_message_media WHERE message_id IN (?)", [messageIds]);

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
    readStatusesByMessageId = allReadStatus.reduce((acc, status) => {
      acc[status.message_id] = status;
      return acc;
    }, {});
  }

  const reactionsByMessageId = await messageReactionRepository.fetchReactionsForMessages(messageIds);
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

  const reactionsByMessageId = await messageReactionRepository.fetchReactionsForMessages(messageIds);
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
  markMessageAsRead: messageReadStatusRepository.markMessageAsRead,
  markMessageAsUnread: messageReadStatusRepository.markMessageAsUnread,
  markMessagesAsRead: messageReadStatusRepository.markMessagesAsRead,
  getReadMessages: async (groupId, userId, options) => {
    // Need to handle media fetching here or pass it in
    const [allMedia] = await db.promise().query("SELECT * FROM group_message_media WHERE group_id = ?", [groupId]);
    const mediaMap = allMedia.reduce((acc, m) => {
      if (!acc[m.message_id]) acc[m.message_id] = [];
      acc[m.message_id].push(m);
      return acc;
    }, {});
    return messageReadStatusRepository.getReadMessages(groupId, userId, options, messageReactionRepository.fetchReactionsForMessages, fetchParentMessages, mediaMap);
  },
  getUnreadMessages: async (groupId, userId, options) => {
    const [allMedia] = await db.promise().query("SELECT * FROM group_message_media WHERE group_id = ?", [groupId]);
    const mediaMap = allMedia.reduce((acc, m) => {
      if (!acc[m.message_id]) acc[m.message_id] = [];
      acc[m.message_id].push(m);
      return acc;
    }, {});
    return messageReadStatusRepository.getUnreadMessages(groupId, userId, options, messageReactionRepository.fetchReactionsForMessages, fetchParentMessages, mediaMap);
  },
  getUnreadCount: messageReadStatusRepository.getUnreadCount,
  buildUnreadTotalQuery: messageReadStatusRepository.buildUnreadTotalQuery,
  toggleReaction: messageReactionRepository.toggleReaction,
  getReactions: messageReactionRepository.getReactions,
  determineResourceCategory,
};
