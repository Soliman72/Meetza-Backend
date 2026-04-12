/**
 * Single visibility rule for all video operations.
 * Super_Admin: all videos. Administrator: own videos + groups they admin.
 * Member: videos from groups they're in.
 *
 * @param {object} req - request with req.user (id, role), req.isSuperAdmin, req.administratorId
 * @param {string} [tableAlias='v'] - SQL alias for the video table
 * @returns {{ whereClause: string, params: any[] }} use with `WHERE ...` or `AND ...` when non-empty
 */
function getVideoVisibility(req, tableAlias = "v") {
  const v = tableAlias;
  const userId = req.user?.id;
  if (!userId) return { whereClause: "", params: [] };
  if (req.isSuperAdmin === true || req.user?.role === "Super_Admin") {
    return { whereClause: "", params: [] };
  }
  if (req.user?.role === "Administrator" || req.administratorId) {
    return {
      whereClause: `(${v}.administrator_id = ? OR ${v}.group_id IN (SELECT group_id FROM group_admin WHERE user_id = ?))`,
      params: [userId, userId],
    };
  }
  if (req.user?.role === "Member") {
    return {
      whereClause: `${v}.group_id IN (SELECT group_id FROM group_membership WHERE member_id = ?)`,
      params: [userId],
    };
  }
  return { whereClause: "", params: [] };
}

module.exports = { getVideoVisibility };
