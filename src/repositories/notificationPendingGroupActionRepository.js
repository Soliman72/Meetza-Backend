const db = require("../config/db");

const query = (sql, params = []) => db.promise().execute(sql, params);

exports.create = async ({
  notificationId,
  pendingGroupId,
  approveUrl,
  rejectUrl,
  status,
}) => {
  const resolvedStatus = status || "pending";
  const [rows] = await query(
    `INSERT INTO notification_pending_group_action
     (notification_id, pending_group_id, approve_url, reject_url, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      notificationId,
      pendingGroupId,
      approveUrl,
      rejectUrl,
      resolvedStatus,
    ]
  );
  return rows[0];
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

exports.findRecipientsByPendingGroupId = async (pendingGroupId) => {
  const [rows] = await query(
    `SELECT npga.notification_id,
            n.member_id,
            npga.pending_group_id,
            npga.approve_url,
            npga.reject_url,
            npga.status
     FROM notification_pending_group_action npga
     INNER JOIN notifications n ON n.id = npga.notification_id
     WHERE npga.pending_group_id = ?`,
    [pendingGroupId]
  );
  return rows;
};