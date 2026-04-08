const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

async function isGroupAdmin(userId, groupId) {
  const [rows] = await db
    .promise()
    .query("SELECT id FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1", [
      groupId,
      userId,
    ]);
  return rows.length > 0;
}

async function isMeetingAdmin(userId, meetingId) {
  const [rows] = await db
    .promise()
    .query(
      "SELECT id FROM meeting_admin WHERE meeting_id = ? AND user_id = ? LIMIT 1",
      [meetingId, userId],
    );
  return rows.length > 0;
}

async function assignGroupAdmin({
  groupId,
  userId,
  role = "ADMIN",
  assignedBy = null,
}) {
  await db.promise().query(
    `INSERT INTO group_admin (id, group_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [uuidv4(), groupId, userId, role, assignedBy],
  );
}

async function assignMeetingAdmin({
  meetingId,
  userId,
  role = "ADMIN",
  assignedBy = null,
}) {
  await db.promise().query(
    `INSERT INTO meeting_admin (id, meeting_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [uuidv4(), meetingId, userId, role, assignedBy],
  );
}

module.exports = {
  isGroupAdmin,
  isMeetingAdmin,
  assignGroupAdmin,
  assignMeetingAdmin,
};
