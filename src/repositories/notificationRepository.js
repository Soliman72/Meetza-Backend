const db = require("../config/db");

const query = (sql, params = []) =>
  db.promise().execute(sql, params);

const getByMemberId = async (memberId) => {
  const [rows] = await query(
    `SELECT n.*, u.name AS sender_name, u.user_photo, u.email,
            pga.pending_group_id AS npga_pending_group_id,
            pga.approve_url AS npga_approve_url,
            pga.reject_url AS npga_reject_url
     FROM notifications n
     JOIN user u ON n.sender_id = u.id
     LEFT JOIN notification_pending_group_action pga
       ON pga.notification_id = n.id
     WHERE n.member_id = ?
     ORDER BY n.created_at DESC`,
    [memberId]
  );
  return rows.map((row) => {
    const {
      npga_pending_group_id,
      npga_approve_url,
      npga_reject_url,
      ...rest
    } = row;
    const out = { ...rest };
    if (npga_pending_group_id) {
      out.pending_group_approval = {
        pending_group_id: npga_pending_group_id,
        approve_url: npga_approve_url,
        reject_url: npga_reject_url,
      };
    }
    return out;
  });
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