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
  return rows[0];
};

const saveMessage = async (groupId, senderId, message) => {
  const trimmed = (message || "").trim();
  if (!trimmed) {
    throw new Error("Message text is required");
  }

  const id = uuidv4();
  await db
    .promise()
    .query(
      "INSERT INTO group_message (id, group_id, sender_id, message) VALUES (?, ?, ?, ?)",
      [id, groupId, senderId, trimmed]
    );

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

  // Return messages in chronological order
  return rows.reverse();
};

module.exports = {
  saveMessage,
  getMessages,
  fetchMessageById,
};
