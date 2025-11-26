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
  const [rows] = await db.promise().query(
    `
        SELECT
          g.id AS group_id,
          g.group_name,
          g.description,
          g.group_photo,
          g.group_content_id,
          g.administrator_id,
          CASE
            WHEN g.administrator_id = ? THEN 'Administrator'
            WHEN gm.member_id IS NOT NULL THEN 'Member'
            ELSE NULL
          END AS membership_role
        FROM \`group\` g
        LEFT JOIN group_membership gm
          ON gm.group_id = g.id AND gm.member_id = ?
        WHERE g.id = ?
        LIMIT 1
      `,
    [userId, userId, groupId]
  );

  if (!rows.length) {
    throw new GroupAccessError("Group not found", 404);
  }

  // if role is Super Admin, allow access
  if (!rows[0].membership_role && rows[0].membership_role !== "Super_Admin") {
    throw new GroupAccessError("You do not have access to this group", 403);
  }

  return rows[0];
};

module.exports = {
  ensureGroupAccess,
  GroupAccessError,
};
