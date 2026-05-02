const db = require("../config/db");

exports.findGroupAdmin = async (groupId, userId) => {
  const [rows] = await db.promise().query(
    "SELECT id FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
    [groupId, userId]
  );
  return rows[0];
};

exports.upsertGroupAdmin = async ({ id, groupId, userId, role, assignedBy }) => {
  await db.promise().query(
    `INSERT INTO group_admin (id, group_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [id, groupId, userId, role, assignedBy]
  );
};