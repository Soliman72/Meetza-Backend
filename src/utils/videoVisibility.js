const { sanitizeAlias } = require("./sqlSanitizeAlias");

function getVideoVisibility(req, tableAlias = "v") {
  const v = sanitizeAlias(tableAlias, ["v"]);
  const userId = req.user?.id;

  if (!userId) return { whereClause: "", params: [] };

  if (req.isSuperAdmin === true || req.user?.role === "Super_Admin") {
    return { whereClause: "", params: [] };
  }

  if (req.user?.role === "Administrator" || req.administratorId) {
    return {
      whereClause: `${v}.group_id IN (SELECT group_id FROM group_admin WHERE user_id = ?)`,
      params: [userId],
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