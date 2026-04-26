const db = require("../config/db");

const query = (sql, params = []) => db.promise().execute(sql, params);

exports.create = async ({
  notificationId,
  pendingGroupId,
  approveUrl,
  rejectUrl,
}) => {
  await query(
    `INSERT INTO notification_pending_group_action
     (notification_id, pending_group_id, approve_url, reject_url)
     VALUES (?, ?, ?, ?)`,
    [notificationId, pendingGroupId, approveUrl, rejectUrl]
  );
};
