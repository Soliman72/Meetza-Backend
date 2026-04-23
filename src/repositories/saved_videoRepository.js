const db = require("../config/db");
const { WATCH_PROGRESS_SELECT } = require("../utils/videoWatchProgressFields");

const TOPICS_SUBSELECTS = `(
        SELECT vts.topics FROM video_transcript_summary vts
        WHERE vts.video_id = v.id AND vts.language = 'ar' ORDER BY vts.updated_at DESC LIMIT 1
      ) AS topics_ar,
      (
        SELECT vts.topics FROM video_transcript_summary vts
        WHERE vts.video_id = v.id AND vts.language = 'en' ORDER BY vts.updated_at DESC LIMIT 1
      ) AS topics_en`;

exports.videoExistsById = async (video_id) => {
  const [rows] = await db
    .promise()
    .query("SELECT id FROM video WHERE id = ?", [video_id]);
  return rows.length > 0;
};

exports.insertSaved = async (member_id, video_id) => {
  await db.promise().query(
    "INSERT INTO saved_video (member_id, video_id, timestamp) VALUES (?, ?, NOW())",
    [member_id, video_id]
  );
};

exports.countByVideoId = async (video_id) => {
  const [rows] = await db
    .promise()
    .query("SELECT COUNT(*) AS count FROM saved_video WHERE video_id = ?", [
      video_id,
    ]);
  return Number(rows[0]?.count) || 0;
};

exports.listForMember = async (user_id, searchFilter) => {
  const { clause, params: sfParams } = searchFilter;
  let query = `SELECT v.*, sv.timestamp AS saved_at, u.name AS admin_name, u.user_photo AS admin_photo, ${TOPICS_SUBSELECTS},
      ${WATCH_PROGRESS_SELECT}
    FROM saved_video sv
    LEFT JOIN video v ON sv.video_id = v.id
    JOIN user u ON v.administrator_id = u.id
    LEFT JOIN video_watch_progress vwp ON vwp.video_id = v.id AND vwp.user_id = ?`;

  const conditions = ["sv.member_id = ?"];
  const params = [user_id, user_id];
  if (clause) {
    conditions.push(clause);
    params.push(...sfParams);
  }
  query += ` WHERE ${conditions.join(" AND ")} ORDER BY sv.timestamp DESC`;
  const [rows] = await db.promise().query(query, params);
  return rows;
};

exports.listForMemberAndVideo = async (user_id, video_id) => {
  const query = `SELECT v.*, sv.timestamp AS saved_at, u.name AS admin_name, u.user_photo AS admin_photo, ${TOPICS_SUBSELECTS},
      ${WATCH_PROGRESS_SELECT}
    FROM saved_video sv
    LEFT JOIN video v ON sv.video_id = v.id
    JOIN user u ON v.administrator_id = u.id
    LEFT JOIN video_watch_progress vwp ON vwp.video_id = v.id AND vwp.user_id = ?
    WHERE sv.video_id = ? AND sv.member_id = ? ORDER BY sv.timestamp DESC`;
  const [rows] = await db.promise().query(query, [user_id, video_id, user_id]);
  return rows;
};

exports.listAllWithFilters = async ({ viewerId, group_id, searchFilter }) => {
  const { clause, params: sfParams } = searchFilter;
  let query = `SELECT v.*, sv.timestamp AS saved_at, u.name AS admin_name, u.user_photo AS admin_photo, ${TOPICS_SUBSELECTS}${
    viewerId ? `, ${WATCH_PROGRESS_SELECT}` : ""
  }
    FROM saved_video sv
    LEFT JOIN video v ON sv.video_id = v.id
    JOIN user u ON v.administrator_id = u.id${
      viewerId
        ? ` LEFT JOIN video_watch_progress vwp ON vwp.video_id = v.id AND vwp.user_id = ?`
        : ""
    }`;

  const conditions = [];
  const params = [];
  if (viewerId) params.push(viewerId);
  if (group_id) {
    conditions.push("v.group_id = ?");
    params.push(group_id);
  }
  if (clause) {
    conditions.push(clause);
    params.push(...sfParams);
  }
  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY sv.timestamp DESC";
  const [rows] = await db.promise().query(query, params);
  return rows;
};

exports.deleteByMemberAndVideo = async (member_id, video_id) => {
  const [result] = await db.promise().query(
    "DELETE FROM saved_video WHERE member_id = ? AND video_id = ?",
    [member_id, video_id]
  );
  return result;
};
