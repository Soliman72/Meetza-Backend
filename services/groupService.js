const db = require("../config/db");

async function attachAdminsToGroups(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return groups;
  const groupIds = groups.map((g) => g.id);
  const placeholders = groupIds.map(() => "?").join(",");
  const [admins] = await db.promise().query(
    `SELECT ga.group_id, ga.user_id, ga.role, ga.assigned_by, ga.created_at,
            u.name, u.email, u.user_photo
     FROM group_admin ga
     JOIN user u ON u.id = ga.user_id
     WHERE ga.group_id IN (${placeholders})
     ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC`,
    groupIds,
  );

  const adminsByGroup = admins.reduce((acc, row) => {
    if (!acc[row.group_id]) acc[row.group_id] = [];
    acc[row.group_id].push(row);
    return acc;
  }, {});

  return groups.map((group) => ({
    ...group,
    admins: adminsByGroup[group.id] || [],
  }));
}

/**
 * Extracts an array from request body supporting standard arrays,
 * JSON strings, comma-separated strings, and indexed form-data keys (e.g., key[0], key[1]).
 */
function extractArray(body, key) {
  if (!body) return [];
  let result = [];

  if (body[key]) {
    const val = body[key];
    if (Array.isArray(val)) {
      result = result.concat(val);
    } else if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) result = result.concat(parsed);
        else result.push(val);
      } catch (e) {
        result = result.concat(val.split(",").map((s) => s.trim()).filter((s) => !!s));
      }
    } else {
      result.push(val);
    }
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedKey}\\[\\d*\\]$`);

  Object.keys(body).forEach((k) => {
    if (regex.test(k)) {
      const val = body[k];
      if (val !== undefined && val !== null) {
        result.push(val);
      }
    }
  });

  return [...new Set(result.map((i) => i.toString().trim()))];
}

module.exports = {
  attachAdminsToGroups,
  extractArray,
};
