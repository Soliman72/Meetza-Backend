const VIDEO_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidLike(value) {
  return VIDEO_UUID_REGEX.test(String(value).trim());
}

/**
 * Resolve an identifier to the real `video.id` (supports both uuid `id` and string `slug`)
 * @param {object} db mysql2 pool wrapper from ../config/db
 * @param {string} identifier
 * @returns {Promise<string|null>}
 */
async function resolveVideoId(db, identifier) {
  const raw = identifier == null ? "" : String(identifier).trim();
  if (!raw) return null;

  const column = isUuidLike(raw) ? "id" : "slug";
  const [rows] = await db
    .promise()
    .query(`SELECT id FROM video WHERE ${column} = ? LIMIT 1`, [raw]);

  return rows[0]?.id ?? null;
}

/**
 * Resolve a video row by identifier (uuid `id` or string `slug`)
 * @param {object} db mysql2 pool wrapper from ../config/db
 * @param {string} identifier
 * @returns {Promise<object|null>}
 */
async function resolveVideoByIdOrSlug(db, identifier) {
  const raw = identifier == null ? "" : String(identifier).trim();
  if (!raw) return null;

  const column = isUuidLike(raw) ? "id" : "slug";
  const [rows] = await db
    .promise()
    .query(
      `SELECT * FROM video WHERE ${column} = ? LIMIT 1`,
      [raw],
    );

  return rows[0] ?? null;
}

module.exports = { resolveVideoId, resolveVideoByIdOrSlug };

