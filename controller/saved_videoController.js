const db = require("../config/db");

// Create
exports.createSavedVideo = async (req, res) => {
  try {
    const { video_id } = req.body;
    const user_id = req.user?.id;
    
    // Validate required fields
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found" });
    }
    if (!video_id) {
      return res.status(400).json({ success: false, message: "video_id is required" });
    }
    // Check if video exists
    const [videoExists] = await db
      .promise()
        .query("SELECT id FROM video WHERE id = ?", [video_id]);
    if (videoExists.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid video_id: not found" });
    }
    const sql = "INSERT INTO saved_video (member_id, video_id, timestamp) VALUES (?, ?, NOW())";
    await db.promise().query(sql, [user_id, video_id]);
    res.status(201).json({ success: true, data: { user_id, video_id, timestamp: new Date() } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Read all saved videos for a user
exports.getSavedVideosByUserId = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found" });
    }
    // Return the same fields as `video` plus extra info from `saved_video` (timestamp)
    const query =
      "SELECT v.*, sv.timestamp AS saved_at, u.name AS admin_name, u.user_photo AS admin_photo FROM saved_video sv LEFT JOIN video v ON sv.video_id = v.id JOIN user u ON v.administrator_id = u.id WHERE sv.member_id = ? ORDER BY sv.timestamp DESC";
    const [rows] = await db.promise().query(query, [user_id]);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Read by id
exports.getSavedVideoById = async (req, res) => {
  try {
    const { video_id } = req.params;
    if (!video_id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }
    const user_id = req.user?.id;
    // Count saved videos
    const sqlCount = 'SELECT COUNT(*) as count FROM saved_video WHERE video_id = ?';
    const [countRows] = await db.promise().query(sqlCount, [video_id]);
    const savedVideoCount = countRows[0].count;
    const query = "SELECT v.*, sv.timestamp AS saved_at, u.name AS admin_name, u.user_photo AS admin_photo FROM saved_video sv LEFT JOIN video v ON sv.video_id = v.id JOIN user u ON v.administrator_id = u.id WHERE sv.video_id = ? AND sv.member_id = ? ORDER BY sv.timestamp DESC";
    const [rows] = await db.promise().query(query, [video_id, user_id]);
    res.status(200).json({ success: true, data: { savedVideoCount, saved_video: rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Read all saved videos
exports.getAllSavedVideos = async (req, res) => {
  try {
    const query = "SELECT v.*, sv.timestamp AS saved_at, u.name AS admin_name, u.user_photo AS admin_photo FROM saved_video sv LEFT JOIN video v ON sv.video_id = v.id JOIN user u ON v.administrator_id = u.id ORDER BY sv.timestamp DESC";
    const [rows] = await db.promise().query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// delete
exports.deleteSavedVideo = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { video_id } = req.params;
    if (!user_id || !video_id) {
      return res.status(400).json({ success: false, message: "user_id and video_id are required" });
    }
    const sql = 'DELETE FROM saved_video WHERE member_id = ? AND video_id = ?';
    const [result] = await db.promise().query(sql, [user_id, video_id]);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};