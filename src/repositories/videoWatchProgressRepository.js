const db = require("../config/db");
const { assertSafeSqlFragment } = require("../utils/sqlSafety");

/** Get one progress */
async function findOne(userId, videoId) {
  const [rows] = await db.promise().query(
    `SELECT vwp.*, TIME_TO_SEC(v.duration) AS duration_seconds
     FROM video_watch_progress vwp
     JOIN video v ON v.id = vwp.video_id
     WHERE vwp.user_id = ? AND vwp.video_id = ?`,
    [userId, videoId]
  );

  return rows[0] || null;
}

/** List user progress */
async function findByUser(userId, limit, offset, visibility) {
  let sql = `
    SELECT vwp.*, TIME_TO_SEC(v.duration) AS duration_seconds,
           v.title, v.slug, v.poster_url
    FROM video_watch_progress vwp
    JOIN video v ON v.id = vwp.video_id
    WHERE vwp.user_id = ?
  `;

  const params = [userId];

  if (visibility?.whereClause) {
    assertSafeSqlFragment(visibility.whereClause, "visibility.whereClause");
    sql += " AND " + visibility.whereClause;
    params.push(...visibility.params);
  }

  sql += " ORDER BY vwp.updated_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const [rows] = await db.promise().query(sql, params);
  return rows;
}

/** Insert or update progress */
async function upsert(userId, videoId, progress_seconds, completed) {
  await db.promise().query(
    `INSERT INTO video_watch_progress
     (user_id, video_id, progress_seconds, completed)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     progress_seconds = VALUES(progress_seconds),
     completed = VALUES(completed),
     updated_at = CURRENT_TIMESTAMP`,
    [userId, videoId, progress_seconds, completed ? 1 : 0]
  );

  return findOne(userId, videoId);
}

/** Delete progress */
async function remove(userId, videoId) {
  const [result] = await db.promise().query(
    `DELETE FROM video_watch_progress
     WHERE user_id = ? AND video_id = ?`,
    [userId, videoId]
  );

  return result.affectedRows > 0;
}

/** check access */
async function checkAccess(videoId, visibility) {
  let sql = `SELECT id FROM video WHERE id = ?`;
  const params = [videoId];

  if (visibility?.whereClause) {
    assertSafeSqlFragment(visibility.whereClause, "visibility.whereClause");
    sql += " AND " + visibility.whereClause;
    params.push(...visibility.params);
  }

  const [rows] = await db.promise().query(sql, params);
  return rows.length > 0;
}

module.exports = {
  findOne,
  findByUser,
  upsert,
  remove,
  checkAccess,
};