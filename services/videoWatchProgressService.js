const db = require("../config/db");
const { getVideoVisibility } = require("../utils/videoVisibility");

const LIST_DEFAULT_LIMIT = 30;
const LIST_MAX_LIMIT = 100;

async function isVideoAccessibleToRequester(req, videoId) {
  const vis = getVideoVisibility(req, "v");
  let sql = "SELECT v.id FROM video v WHERE v.id = ?";
  const params = [videoId];
  if (vis.whereClause) {
    sql += " AND " + vis.whereClause;
    params.push(...vis.params);
  }
  const [rows] = await db.promise().query(sql, params);
  return rows.length > 0;
}

/**
 * Shape for API: watch_status + progress_percentage (same rules as home).
 */
function buildProgressPayload(row) {
  if (!row) return null;
  const durationSec = Number(row.duration_seconds);
  const ps = Number(row.progress_seconds) || 0;
  const completed = row.completed === 1 || row.completed === true;
  let watch_status = null;
  if (completed) watch_status = "completed";
  else if (ps > 0) watch_status = "watching";
  let progress_percentage = null;
  if (completed) progress_percentage = 100;
  else if (durationSec > 0 && ps > 0) {
    progress_percentage = Math.min(
      100,
      Math.round((100 * ps) / durationSec),
    );
  }
  return {
    video_id: row.video_id,
    progress_seconds: ps,
    completed,
    updated_at: row.updated_at,
    watch_status,
    progress_percentage,
  };
}

async function getByUserAndVideo(userId, videoId) {
  const [rows] = await db.promise().query(
    `SELECT vwp.user_id, vwp.video_id, vwp.progress_seconds, vwp.completed, vwp.updated_at,
            TIME_TO_SEC(v.duration) AS duration_seconds
     FROM video_watch_progress vwp
     INNER JOIN video v ON v.id = vwp.video_id
     WHERE vwp.user_id = ? AND vwp.video_id = ?`,
    [userId, videoId],
  );
  return rows[0] || null;
}

async function listByUser(req, { limit, offset }) {
  const userId = req.user.id;
  const lim = Number(limit);
  const cap = Number.isFinite(lim)
    ? Math.min(Math.max(Math.trunc(lim), 1), LIST_MAX_LIMIT)
    : LIST_DEFAULT_LIMIT;
  const off = Number(offset);
  const skip = Number.isFinite(off) && off >= 0 ? Math.trunc(off) : 0;

  const vis = getVideoVisibility(req, "v");
  let sql = `
    SELECT vwp.user_id, vwp.video_id, vwp.progress_seconds, vwp.completed, vwp.updated_at,
           TIME_TO_SEC(v.duration) AS duration_seconds,
           v.title, v.slug, v.poster_url
    FROM video_watch_progress vwp
    INNER JOIN video v ON v.id = vwp.video_id
    WHERE vwp.user_id = ?
  `;
  const params = [userId];
  if (vis.whereClause) {
    sql += " AND " + vis.whereClause;
    params.push(...vis.params);
  }
  sql += " ORDER BY vwp.updated_at DESC LIMIT ? OFFSET ?";
  params.push(cap, skip);

  const [rows] = await db.promise().query(sql, params);
  return (rows || []).map((row) => ({
    ...buildProgressPayload(row),
    title: row.title,
    slug: row.slug,
    poster_url: row.poster_url,
    thumbnail_url: row.poster_url,
  }));
}

async function upsert(userId, videoId, { progress_seconds, completed }) {
  await db.promise().query(
    `INSERT INTO video_watch_progress (user_id, video_id, progress_seconds, completed)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       progress_seconds = VALUES(progress_seconds),
       completed = VALUES(completed),
       updated_at = CURRENT_TIMESTAMP`,
    [userId, videoId, progress_seconds, completed ? 1 : 0],
  );
  return getByUserAndVideo(userId, videoId);
}

async function remove(userId, videoId) {
  const [result] = await db.promise().query(
    "DELETE FROM video_watch_progress WHERE user_id = ? AND video_id = ?",
    [userId, videoId],
  );
  return result.affectedRows > 0;
}

module.exports = {
  isVideoAccessibleToRequester,
  getByUserAndVideo,
  buildProgressPayload,
  listByUser,
  upsert,
  remove,
  LIST_DEFAULT_LIMIT,
  LIST_MAX_LIMIT,
};
