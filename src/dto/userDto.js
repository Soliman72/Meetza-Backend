/**
 * User DTOs – map DB user rows to safe, consistent shapes for API responses.
 * Excludes sensitive fields (password, verification_code, etc.).
 */

/**
 * Public user (profile, list items)
 * @param {object} row - user row from DB
 * @returns {object}
 */
const toPublic = (row) => {
  if (!row) return null;
  return {
    name: row.name,
    email: row.email,
    user_photo: row.user_photo ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Minimal user (for nested objects, e.g. comment author)
 */
const toMinimal = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    user_photo: row.user_photo ?? null,
  };
};

/**
 * Map array of user rows
 */
const toPublicList = (rows) => (rows || []).map(toPublic);

// for get all users with role
const toPublicListWithRole = (rows) => (rows || []).map(toPublicWithRole);
const toPublicWithRole = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    user_photo: row.user_photo ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const toProfile = (row, positions = []) => {
  if (!row) return null;
  return {
    ...toPublicWithRole(row),
    positions: (positions || []).map((position) => ({
      id: position.id,
      title: position.title,
    })),
  };
};

module.exports = {
  toPublic,
  toMinimal,
  toPublicList,
  toPublicWithRole,
  toPublicListWithRole,
  toProfile,
};
