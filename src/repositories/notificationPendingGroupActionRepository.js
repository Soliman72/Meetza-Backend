const db = require("../config/db");

const query = (sql, params = []) => db.promise().execute(sql, params);

exports.create = async ({
  notificationId,
  pendingGroupId,
  approveUrl,
  rejectUrl,
  status,
}) => {
  await query(
    `INSERT INTO notification_pending_group_action
     (notification_id, pending_group_id, approve_url, reject_url, status)
     VALUES (?, ?, ?, ?, ?)`,
    [notificationId, pendingGroupId, approveUrl, rejectUrl, status]
  );
};

exports.updateStatus = async ({
  pendingGroupId,
  status,
}) => {
  await query(
    `UPDATE notification_pending_group_action
     SET status = ?
     WHERE pending_group_id = ?`,
    [status, pendingGroupId]
  );
};