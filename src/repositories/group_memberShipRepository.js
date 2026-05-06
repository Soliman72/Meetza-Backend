const db = require("../config/db");

exports.insert = async ({ id, group_id, member_id }) => {
  await db.promise().query(
    "INSERT INTO group_membership (id, group_id, member_id) VALUES (?, ?, ?)",
    [id, group_id, member_id]
  );
};

exports.exists = async (group_id, member_id) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM group_membership WHERE group_id = ? AND member_id = ?",
    [group_id, member_id]
  );
  return rows.length > 0;
};

exports.findGroupMembership = async (groupId, userId) => {
  const [rows] = await db.promise().query(
    "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
    [groupId, userId]
  );
  return rows[0] || null;
};

exports.removeGroupMembership = async (memberId, groupId) => {
  const [result] = await db.promise().execute(
    "DELETE FROM group_membership WHERE member_id = ? AND group_id = ?",
    [memberId, groupId]
  );
  return result.affectedRows > 0;
};

exports.getMemberIdsByGroupId = async (groupId) => {
  const [rows] = await db.promise().query(
    "SELECT member_id FROM group_membership WHERE group_id = ?",
    [groupId]
  );
  return rows.map((r) => r.member_id);
};

exports.findGroupById = async (group_id) => {
  const [rows] = await db.promise().query("SELECT * FROM `group` WHERE id = ?", [
    group_id,
  ]);
  return rows[0] || null;
};

exports.findMemberByUserId = async (user_id) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM member WHERE user_id = ?",
    [user_id]
  );
  return rows[0] || null;
};

exports.findById = async (id) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM group_membership WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

exports.updateGroupId = async (membershipId, group_id) => {
  const [result] = await db.promise().query(
    "UPDATE group_membership SET group_id = ? WHERE id = ?",
    [group_id, membershipId]
  );
  return result.affectedRows;
};

exports.deleteById = async (id) => {
  const [result] = await db.promise().query(
    "DELETE FROM group_membership WHERE id = ?",
    [id]
  );
  return result.affectedRows;
};

exports.getAllGroupedRows = async (userId, userRole) => {
  let query = `
      SELECT 
        g.id as group_id, 
        g.group_name as group_name,
        m.user_id as member_id,
        gm.id as membership_id,
        u.name as member_name,
        u.email as member_email,
        u.user_photo as member_photo
      FROM group_membership gm
      JOIN \`group\` g ON g.id = gm.group_id
      JOIN member m ON m.user_id = gm.member_id
      JOIN user u ON u.id = gm.member_id
    `;
  const params = [];

  if (userRole === "Administrator") {
    query +=
      " JOIN group_admin perm ON perm.group_id = g.id AND perm.user_id = ?";
    params.push(userId);
  } else if (userRole === "Member") {
    query +=
      " JOIN group_membership gm_perm ON gm_perm.group_id = g.id AND gm_perm.member_id = ?";
    params.push(userId);
  }

  const [rows] = await db.promise().query(query, params);
  return rows;
};

exports.leaveDeleteGroupMembership = async (conn, groupId, memberId) => {
  await conn.query(
    "DELETE FROM group_membership WHERE group_id = ? AND member_id = ?",
    [groupId, memberId]
  );
};
