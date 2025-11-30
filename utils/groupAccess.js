const db = require("../config/db");

class GroupAccessError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = "GroupAccessError";
    this.statusCode = statusCode;
  }
}

/**
 * Ensures that the provided user is either an administrator or a member of the group.
 * Returns the group record together with the resolved role.
 */
const ensureGroupAccess = async (userId, groupId) => {
  // First, get user role to check if Super_Admin
  const [userRows] = await db
    .promise()
    .query(`SELECT role FROM user WHERE id = ? LIMIT 1`, [userId]);
  const userRole = userRows[0]?.role;

  let groupData;
  let membershipRole;

  if (userRole === "Super_Admin") {
    // If Super_Admin, allow access to any group
    const [groupRows] = await db.promise().query(
      `
        SELECT
          g.id AS group_id,
          g.group_name,
          g.description,
          g.group_photo,
          g.group_content_id,
          g.administrator_id,
          u.name,
          u.email,
          u.user_photo,
          'Super_Admin' AS membership_role
        FROM \`group\` g
        JOIN user u ON u.id = g.administrator_id
        WHERE g.id = ?
        LIMIT 1
      `,
      [groupId]
    );
    if (!groupRows.length) {
      throw new GroupAccessError("Group not found", 404);
    }
    groupData = groupRows[0];
    membershipRole = "Super_Admin";
  } else {
    // Else, check if administrator or member of the group
    const [rows] = await db.promise().query(
      `
        SELECT
          g.id AS group_id,
          g.group_name,
          g.description,
          g.group_photo,
          g.group_content_id,
          g.administrator_id,
          u.name,
          u.email,
          u.user_photo,
          CASE
            WHEN g.administrator_id = ? THEN 'Administrator'
            WHEN gm.member_id IS NOT NULL THEN 'Member'
            ELSE NULL
          END AS membership_role
        FROM \`group\` g
        LEFT JOIN group_membership gm
          ON gm.group_id = g.id AND gm.member_id = ?
        JOIN user u ON u.id = g.administrator_id
        WHERE g.id = ?
        LIMIT 1
      `,
      [userId, userId, groupId]
    );
    if (!rows.length) {
      throw new GroupAccessError("Group not found", 404);
    }
    if (!rows[0].membership_role) {
      throw new GroupAccessError("You do not have access to this group", 403);
    }
    groupData = rows[0];
    membershipRole = groupData.membership_role;
  }

  // Now, also get the group media
  const [mediaRows] = await db.promise().query(
    `
      SELECT
        id,
        sender_id,
        media_url,
        media_type,
        created_at
      FROM group_message_media
      WHERE group_id = ?
      ORDER BY created_at DESC
    `,
    [groupData.group_id]
  );

  // Add group_media as array to groupData
  return {
    ...groupData,
    group_media: mediaRows || [],
  };
};

module.exports = {
  ensureGroupAccess,
  GroupAccessError,
};
