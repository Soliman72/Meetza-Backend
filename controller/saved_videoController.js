const db = require("../config/db");
const { WATCH_PROGRESS_SELECT } = require("../utils/videoWatchProgressFields");
const {
  buildVideoSearchCondition,
  mapSavedVideoRow,
} = require("../services/videoSearchService");

const TOPICS_SUBSELECTS = `(
        SELECT vts.topics FROM video_transcript_summary vts
        WHERE vts.video_id = v.id AND vts.language = 'ar' ORDER BY vts.updated_at DESC LIMIT 1
      ) AS topics_ar,
      (
        SELECT vts.topics FROM video_transcript_summary vts
        WHERE vts.video_id = v.id AND vts.language = 'en' ORDER BY vts.updated_at DESC LIMIT 1
      ) AS topics_en`;

// Create
exports.createSavedVideo = async (req, res) => {
  try {
    const { video_id } = req.body;
    const user_id = req.user?.id;

    // Validate required fields
    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    if (!video_id) {
      return res
        .status(400)
        .json({ success: false, message: "video_id is required" });
    }
    // Check if video exists
    const [videoExists] = await db
      .promise()
      .query("SELECT id FROM video WHERE id = ?", [video_id]);
    if (videoExists.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid video_id: not found" });
    }
    const sql =
      "INSERT INTO saved_video (member_id, video_id, timestamp) VALUES (?, ?, NOW())";
    await db.promise().query(sql, [user_id, video_id]);
    res
      .status(201)
      .json({
        success: true,
        data: { user_id, video_id, timestamp: new Date() },
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Read all saved videos for a user
exports.getSavedVideosByUserId = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { q } = req.query;
    const searchTerm = q;
    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    // Same shape as video list + `watch_progress` for the current user
    let query = `SELECT v.*, sv.timestamp AS saved_at, u.name AS admin_name, u.user_photo AS admin_photo, ${TOPICS_SUBSELECTS},
      ${WATCH_PROGRESS_SELECT}
    FROM saved_video sv
    LEFT JOIN video v ON sv.video_id = v.id
    JOIN user u ON v.administrator_id = u.id
    LEFT JOIN video_watch_progress vwp ON vwp.video_id = v.id AND vwp.user_id = ?`;

    const conditions = ["sv.member_id = ?"];
    const params = [user_id, user_id];
    const searchFilter = buildVideoSearchCondition(searchTerm, "v");
    if (searchFilter.clause) {
      conditions.push(searchFilter.clause);
      params.push(...searchFilter.params);
    }
    query += ` WHERE ${conditions.join(" AND ")} ORDER BY sv.timestamp DESC`;
    const [rows] = await db.promise().query(query, params);
    const data = (rows || []).map((row) => mapSavedVideoRow(row, true));
    res.status(200).json({ success: true, data });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Read by id
exports.getSavedVideoById = async (req, res) => {
  try {
    const { video_id } = req.params;
    if (!video_id) {
      return res
        .status(400)
        .json({ success: false, message: "id is required" });
    }
    const user_id = req.user?.id;
    if (!user_id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    // Count saved videos
    const sqlCount =
      "SELECT COUNT(*) as count FROM saved_video WHERE video_id = ?";
    const [countRows] = await db.promise().query(sqlCount, [video_id]);
    const savedVideoCount = countRows[0].count;
    const query = `SELECT v.*, sv.timestamp AS saved_at, u.name AS admin_name, u.user_photo AS admin_photo, ${TOPICS_SUBSELECTS},
      ${WATCH_PROGRESS_SELECT}
    FROM saved_video sv
    LEFT JOIN video v ON sv.video_id = v.id
    JOIN user u ON v.administrator_id = u.id
    LEFT JOIN video_watch_progress vwp ON vwp.video_id = v.id AND vwp.user_id = ?
    WHERE sv.video_id = ? AND sv.member_id = ? ORDER BY sv.timestamp DESC`;
    const [rows] = await db.promise().query(query, [
      user_id,
      video_id,
      user_id,
    ]);
    const saved_video = (rows || []).map((row) => mapSavedVideoRow(row, true));
    res
      .status(200)
      .json({ success: true, data: { savedVideoCount, saved_video } });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Read all saved videos
exports.getAllSavedVideos = async (req, res) => {
  try {
    const { group_id, q } = req.query;
    const searchTerm = q;
    const viewerId = req.user?.id;
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
    const searchFilter = buildVideoSearchCondition(searchTerm, "v");
    if (searchFilter.clause) {
      conditions.push(searchFilter.clause);
      params.push(...searchFilter.params);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += " ORDER BY sv.timestamp DESC";
    const [rows] = await db.promise().query(query, params);
    const data = (rows || []).map((row) => mapSavedVideoRow(row, !!viewerId));
    res.status(200).json({ success: true, data });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// delete
exports.deleteSavedVideo = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { video_id } = req.params;
    if (!user_id || !video_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id and video_id are required" });
    }
    const sql = "DELETE FROM saved_video WHERE member_id = ? AND video_id = ?";
    const [result] = await db.promise().query(sql, [user_id, video_id]);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};
