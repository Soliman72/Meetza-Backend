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

const saveMessage = async (groupId, senderId, message, media = null) => {
  const trimmed = (message || "").trim();

  const id = uuidv4();

  // Try to insert with media column, fallback if column doesn't exist
  await db
    .promise()
    .query(
      "INSERT INTO group_message (id, group_id, sender_id, message) VALUES (?, ?, ?, ?)",
      [id, groupId, senderId, trimmed]
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

  return fetchMessageById(id);
};

const getMessages = async (groupId, { limit = 50, before } = {}) => {
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

      return {
        ...message,
        media: mediaRows || [],
      };
    })
  );

  return messages.reverse();
};

module.exports = {
  saveMessage,
  getMessages,
  fetchMessageById,
};
