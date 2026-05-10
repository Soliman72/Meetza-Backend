const db = require("../config/db");

exports.findGroupAdmin = async (groupId, userId) => {
  const [rows] = await db.promise().query(
    "SELECT id FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
    [groupId, userId]
  );
  return rows[0];
};

exports.getGroupAdminsWithRoles = async (groupId) => {
  const [rows] = await db.promise().query(
    "SELECT user_id, role FROM group_admin WHERE group_id = ?",
    [groupId]
  );
  return rows;
};

exports.getGroupOwnerUserId = async (groupId) => {
  const [rows] = await db.promise().query(
    "SELECT user_id FROM group_admin WHERE group_id = ? AND role = 'OWNER' LIMIT 1",
    [groupId]
  );
  return rows[0]?.user_id ?? null;
};

exports.getFirstGroupAdminUserId = async (groupId) => {
  const [rows] = await db.promise().query(
    "SELECT user_id FROM group_admin WHERE group_id = ? LIMIT 1",
    [groupId]
  );
  return rows[0]?.user_id ?? null;
};

exports.upsertGroupAdmin = async ({ id, groupId, userId, role, assignedBy }) => {
  await db.promise().query(
    `INSERT INTO group_admin (id, group_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [id, groupId, userId, role, assignedBy]
  );
};

exports.getAdminsByGroupIds = async (groupIds) => {
  if (!Array.isArray(groupIds) || groupIds.length === 0) return [];
  const safeIds = groupIds
    .filter((id) => typeof id === "string" || typeof id === "number")
    .map((id) => id.toString().trim())
    .filter(Boolean);
  if (safeIds.length === 0) return [];
  const placeholders = safeIds.map(() => "?").join(",");
  const [admins] = await db.promise().execute(
    `SELECT 
          ga.group_id, ga.user_id, ga.role, ga.assigned_by, ga.created_at,
          u.name, u.email, u.user_photo
       FROM group_admin ga
       JOIN user u ON u.id = ga.user_id
       WHERE ga.group_id IN (${placeholders})
       ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC`,
    safeIds
  );
  return admins;
};

exports.getOwner = async (groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT ga.user_id FROM group_admin ga 
     WHERE ga.group_id = ? AND ga.role = 'OWNER'`,
    [groupId]
  );
  return rows;
};

exports.countOwners = async (groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT COUNT(*) as count FROM group_admin WHERE group_id = ? AND role = 'OWNER'`,
    [groupId]
  );
  return rows[0].count;
};

exports.removeGroupAdmin = async (groupId, userId) => {
  const [result] = await db.promise().execute(
    `DELETE FROM group_admin 
     WHERE group_id = ? AND user_id = ?`,
    [groupId, userId]
  );
  return result.affectedRows > 0;
};

exports.countOtherAdmins = async (userId, groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT COUNT(*) as count FROM group_admin 
     WHERE group_id = ? AND user_id <> ? AND role <> 'OWNER'`,
    [groupId, userId]
  );
  return rows[0].count;
};

exports.getGroupAdmins = async (groupId) => {
  const [rows] = await db.promise().query(
    `
    SELECT
      ga.user_id,
      u.name,
      u.email,
      u.user_photo,
      ga.role,
      ga.assigned_by,
      ga.created_at
    FROM group_admin ga
    JOIN user u ON u.id = ga.user_id
    WHERE ga.group_id = ?
    ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC
    `,
    [groupId]
  );
  return rows;
};

exports.getAnyOtherAdmin = async (userId, groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT user_id FROM group_admin 
     WHERE group_id = ? AND user_id <> ? AND role <> 'OWNER' LIMIT 1 `,
    [groupId, userId]
  );
  return rows[0];
};

exports.updateGroupAdmin = async (groupId, userId, role) => {
  await db.promise().execute(
    `UPDATE group_admin 
     SET role = ? 
     WHERE group_id = ? AND user_id = ?`,
    [role, groupId, userId]
  );
};

exports.getGroupRoleByUser = async (userId, groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT role FROM group_admin 
     WHERE group_id = ? AND user_id = ?`,
    [groupId, userId]
  );
  return rows[0]?.role;
};

exports.getGroupOwner = async (groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT user_id FROM group_admin 
     WHERE group_id = ? AND role = 'OWNER'`,
    [groupId]
  );
  return rows[0];
};

exports.leaveSelectMyAdminRole = async (conn, groupId, userId) => {
  const [rows] = await conn.query(
    "SELECT role FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
    [groupId, userId]
  );
  return rows;
};

exports.leaveCountOtherAdmins = async (conn, groupId, excludeUserId) => {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM group_admin WHERE group_id = ? AND user_id <> ?",
    [groupId, excludeUserId]
  );
  return Number(rows[0]?.c) || 0;
};

exports.leaveUpsertGroupAdmin = async (
  conn,
  { id, groupId, userId, role, assignedBy }
) => {
  await conn.query(
    `INSERT INTO group_admin (id, group_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [id, groupId, userId, role, assignedBy]
  );
};

exports.leaveDeleteGroupAdmin = async (conn, groupId, userId) => {
  await conn.query(
    "DELETE FROM group_admin WHERE group_id = ? AND user_id = ?",
    [groupId, userId]
  );
};