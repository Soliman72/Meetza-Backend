const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { getVideoVisibility } = require("../utils/videoVisibility");
const { getUserExtras } = require("../utils/videoWatchProgressSQL");
const { VIDEO_AGGREGATIONS } = require("../utils/videoAggregations");
const { buildVideoSearchCondition } = require("../utils/videoSearch");
const { WATCH_PROGRESS_SELECT } = require("../utils/videoWatchProgressFields");
const { assertSafeSqlFragment } = require("../utils/sqlSafety");


const query = (sql, params = []) =>
  db.promise().execute(sql, params);

const createVideo = async (video) => {
  const sql = `
    INSERT INTO video
    (id, title, slug, meeting_id, video_url, poster_url,
     administrator_id, duration, description, group_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, SEC_TO_TIME(?), ?, ?)
  `;

  const id = uuidv4();

  const params = [
    id,
    video.title,
    video.slug,
    video.meeting_id || null,
    video.video_url,
    video.poster_url,
    video.administrator_id,
    video.duration,
    video.description || null,
    video.group_id,
  ];

  await query(sql, params);
  return {
    id,
    title: video.title,
    slug: video.slug,
    meeting_id: video.meeting_id || null,
    video_url: video.video_url,
    poster_url: video.poster_url,
    administrator_id: video.administrator_id,
    duration: video.duration,
    description: video.description || null,
    group_id: video.group_id,
  };
};

const resolveVideoId = async (id) => {
  const [rows] = await db
    .promise()
    .query("SELECT id FROM video WHERE id = ? OR slug = ?", [id, id]);

  return rows[0]?.id || null;
};

const getVideoSourceById = async (videoId) => {
  const [rows] = await db
    .promise()
    .query("SELECT id, video_url FROM video WHERE id = ? LIMIT 1", [videoId]);

  return rows[0] || null;
};


const getVideos = async (req) => {
  const { group_id, q } = req.query;
  const searchTerm = q;

  const visibility = getVideoVisibility(req, "v");
  const userId = req.user?.id;

  const conditions = [];
  const params = [];

  const userExtras = getUserExtras(userId);

  let sql = `
    SELECT v.*, g.group_name,
           u.name AS admin_name,
           u.user_photo AS admin_photo,
           ${VIDEO_AGGREGATIONS}
           ${userExtras.fields ? "," + userExtras.fields : ""}
    FROM video v
    LEFT JOIN \`group\` g ON g.id = v.group_id
    LEFT JOIN user u ON u.id = v.administrator_id
    ${userExtras.join}
  `;

  if (userExtras.params.length) {
    params.push(...userExtras.params);
  }

  if (visibility.whereClause) {
    conditions.push(visibility.whereClause);
    params.push(...visibility.params);
  }

  if (group_id) {
    conditions.push("v.group_id = ?");
    params.push(group_id);
  }

  const searchFilter = buildVideoSearchCondition(searchTerm, "v");
  if (searchFilter.clause) {
    conditions.push(searchFilter.clause);
    params.push(...searchFilter.params);
  }

  if (conditions.length) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY v.created_at DESC LIMIT 50";

  const [rows] = await query(sql, params);
  return rows;
};

const getVideoById = async (videoIdParam, req) => {
  const visibility = getVideoVisibility(req, "v");
  const userId = req.user?.id;

  const userExtras = getUserExtras(userId);

  const resolvedId = await resolveVideoId(videoIdParam);
  if (!resolvedId) {
    throw new Error("Video not found");
  }
  let sql = `
    SELECT v.*, g.group_name,
           u.name AS admin_name,
           u.user_photo AS admin_photo,
           ${VIDEO_AGGREGATIONS}
           ${userExtras.fields ? "," + userExtras.fields : ""}
    FROM video v
    LEFT JOIN \`group\` g ON g.id = v.group_id
    LEFT JOIN user u ON u.id = v.administrator_id
    ${userExtras.join}
    WHERE v.id = ?
  `;

  const params = [...userExtras.params, resolvedId];
  const conditions = [];

  if (visibility.whereClause) {
    conditions.push(visibility.whereClause);
    params.push(...visibility.params);
  }

  if (conditions.length) {
    sql += " AND " + conditions.join(" AND ");
  }

  const [rows] = await query(sql, params);
  return rows[0] || null;
};

const deleteVideo = async (videoId, req) => {
  const vis = getVideoVisibility(req, "v");

  let sql = `DELETE v FROM video v WHERE v.id = ?`;
  const params = [videoId];

  if (vis.whereClause) {
    assertSafeSqlFragment(vis.whereClause, "visibility.whereClause");
    sql += " AND " + vis.whereClause;
    params.push(...vis.params);
  }

  const [result] = await query(sql, params);
  return result.affectedRows;
};

const updateVideo = async (videoId, data, req) => {
  const vis = getVideoVisibility(req, "v");

  const fields = [];
  const params = [];

  const allowedFields = [
    "title",
    "meeting_id",
    "group_id",
    "video_url",
    "poster_url",
    "description",
  ];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }

  if (data.duration !== undefined) {
    fields.push("duration = SEC_TO_TIME(?)");
    params.push(data.duration);
  }

  if (!fields.length) return 0;

  let sql = `
    UPDATE video v
    SET ${fields.join(", ")}
    WHERE v.id = ?
  `;

  params.push(videoId);

  if (vis.whereClause) {
    assertSafeSqlFragment(vis.whereClause, "visibility.whereClause");
    sql += " AND " + vis.whereClause;
    params.push(...vis.params);
  }

  const [result] = await query(sql, params);
  return result.affectedRows;
};

const getRelatedVideos = async (req) => {
  const id = req.params.id;
  const userId = req.user?.id;

  const relatedVideoId = await resolveVideoId(id);
  if (!relatedVideoId) {
    return [];
  }

  const visibility = getVideoVisibility(req, "v");
  let sql = `
    SELECT v.id, v.title, v.poster_url, v.group_id
           ${userId ? `, ${WATCH_PROGRESS_SELECT}` : ""}
    FROM video v
    ${userId ? `
      LEFT JOIN video_watch_progress vwp
        ON vwp.video_id = v.id AND vwp.user_id = ?
    ` : ""}
    WHERE v.group_id = (SELECT group_id FROM video WHERE id = ?) AND v.id <> ?
  `;

  const params = [];

  if (userId) params.push(userId);

  params.push(relatedVideoId, relatedVideoId);

  if (visibility.whereClause) {
    assertSafeSqlFragment(visibility.whereClause, "visibility.whereClause");
    sql += " AND " + visibility.whereClause;
    params.push(...visibility.params);
  }

  sql += " ORDER BY v.created_at DESC LIMIT 10";

  const [rows] = await query(sql, params);
  return rows;
};

const listTranscriptSummariesByVideoId = async (videoId) => {
  const [rows] = await db.promise().query(
    `SELECT id, video_id, language, transcript, summary, topics, updated_at
     FROM video_transcript_summary
     WHERE video_id = ?
     ORDER BY updated_at DESC`,
    [videoId]
  );
  return rows;
};

const getTranscriptSummaryByVideoAndLanguage = async (videoId, language) => {
  const [rows] = await db.promise().query(
    `SELECT language, transcript, summary, topics
     FROM video_transcript_summary
     WHERE video_id = ? AND language = ?
     LIMIT 1`,
    [videoId, language]
  );
  return rows[0] || null;
};

const upsertTranscriptSummary = async ({
  videoId,
  language,
  transcript,
  summary,
  topics,
}) => {
  await db.promise().query(
    `INSERT INTO video_transcript_summary
      (video_id, language, transcript, summary, topics)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       transcript = VALUES(transcript),
       summary = VALUES(summary),
       topics = VALUES(topics),
       updated_at = CURRENT_TIMESTAMP`,
    [videoId, language, transcript, summary, topics]
  );
};

module.exports = {
  createVideo,
  getVideoById,
  getVideos,
  deleteVideo,
  updateVideo,
  getRelatedVideos,
  resolveVideoId,
  getVideoSourceById,
  listTranscriptSummariesByVideoId,
  getTranscriptSummaryByVideoAndLanguage,
  upsertTranscriptSummary,
};