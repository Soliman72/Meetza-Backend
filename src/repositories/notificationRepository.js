const db = require("../config/db");

const query = (sql, params = []) =>
  db.promise().execute(sql, params);

const getByMemberId = async (memberId) => {
  const [rows] = await query(
    `SELECT n.*, u.name AS sender_name, u.user_photo, u.email
     FROM notifications n
     JOIN user u ON n.sender_id = u.id
     WHERE n.member_id = ?
     ORDER BY n.created_at DESC`,
    [memberId]
  );
  return rows;
};

const countUnread = async (memberId) => {
  const [[row]] = await query(
    `SELECT COUNT(*) AS unreadCount
     FROM notifications
     WHERE member_id = ? AND is_read = 0`,
    [memberId]
  );
  return row.unreadCount;
};

const markAsRead = async (id, memberId) => {
  const [res] = await query(
    `UPDATE notifications SET is_read = 1
     WHERE id = ? AND member_id = ?`,
    [id, memberId]
  );
  return res.affectedRows > 0;
};

const markAllAsRead = async (memberId) => {
  await query(
    `UPDATE notifications
     SET is_read = 1
     WHERE member_id = ? AND is_read = 0`,
    [memberId]
  );
};

const remove = async (id, memberId) => {
  const [res] = await query(
    `DELETE FROM notifications
     WHERE id = ? AND member_id = ?`,
    [id, memberId]
  );
  return res.affectedRows > 0;
};

const create = async (data) => {
  await query(
    `INSERT INTO notifications
     (id, member_id, sender_id, title, message, is_read)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.memberId,
      data.senderId,
      data.title,
      data.message,
      0,
    ]
  );
};

module.exports = {
  getByMemberId,
  countUnread,
  markAsRead,
  markAllAsRead,
  remove,
  create,
};