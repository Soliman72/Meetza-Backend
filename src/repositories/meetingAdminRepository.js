const db = require("../config/db");

exports.findMeetingAdmin = async (meetingId, userId) => {
  const [rows] = await db.promise().query(
    `SELECT ga.id
     FROM meeting m
     JOIN group_admin ga ON ga.group_id = m.group_id
     WHERE m.id = ? AND ga.user_id = ?
     LIMIT 1`,
    [meetingId, userId]
  );
  return rows[0];
};

exports.upsertMeetingAdmin = async ({
  id,
  meetingId,
  userId,
  role,
  assignedBy,
}) => {
  await db.promise().query(
    `INSERT INTO meeting_admin (id, meeting_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [id, meetingId, userId, role, assignedBy]
  );
};

exports.removeMeetingAdminByUser = async (groupId, userId) => {
  const [result] = await db.promise().execute(
    `DELETE ma FROM meeting_admin ma
     JOIN meeting m ON m.id = ma.meeting_id
     WHERE m.group_id = ? AND ma.user_id = ?`,
    [groupId, userId]
  );
  return result.affectedRows > 0;
};

exports.leaveUpsertMeetingAdmin = async (
  conn,
  { id, meetingId, userId, role, assignedBy }
) => {
  await conn.query(
    `INSERT INTO meeting_admin (id, meeting_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [id, meetingId, userId, role, assignedBy]
  );
};

exports.leaveDeleteMeetingAdminsForUserInGroup = async (conn, groupId, userId) => {
  await conn.query(
    `DELETE ma FROM meeting_admin ma
     JOIN meeting m ON m.id = ma.meeting_id
     WHERE m.group_id = ? AND ma.user_id = ?`,
    [groupId, userId]
  );
};