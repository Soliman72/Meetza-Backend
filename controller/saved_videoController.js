const db = require("../config/db");

// Create
exports.createSavedVideo = async (req, res) => {
  try {
    const { video_id } = req.body;
    const member_id = req.user?.id;
    
    // Validate required fields
    if (!member_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: member not found",
      });
    }
    if (!video_id) {
      return res.status(400).json({
        success: false,
        message: "video_id is required",
      });
    }
    // Check if video exists
    const [videoExists] = await db
      .promise()
        .query("SELECT id FROM video WHERE id = ?", [video_id]);
    if (videoExists.length === 0) {
        return res.status(400).json({
        success: false,
        message: "Invalid video_id: not found",
      });
    }
    const sql = "INSERT INTO saved_video (member_id, video_id, timestamp) VALUES (?, ?, NOW())";
    await db.promise().query(sql, [member_id, video_id]);
    res.status(201).json({ member_id, video_id, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all saved videos for a member
exports.getSavedVideosByMemberId = async (req, res) => {
  try {
    const member_id = req.user?.id;
    if (!member_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: member not found",
      });
    }
    const [rows] = await db.promise().query('SELECT * FROM saved_video WHERE member_id = ?', [member_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    res.json(rows);
    } catch (err) {
    res.status(500).json({ message: err.message });
    }
};

// Read by id
exports.getSavedVideoById = async (req, res) => {
  try {
    const { video_id } = req.params;
    if (!video_id) {
      return res.status(400).json({ message: 'id is required' });
    }
    // Count saved videos
    const sqlCount = 'SELECT COUNT(*) as count FROM saved_video WHERE video_id = ?';
    const [countRows] = await db.promise().query(sqlCount, [video_id]);
    const savedVideoCount = countRows[0].count;
    const [rows] = await db.promise().query('SELECT * FROM saved_video WHERE video_id = ?', [video_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    res.json({ savedVideoCount, saved_videos: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all saved videos
exports.getAllSavedVideos = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM saved_video');
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// delete
exports.deleteSavedVideo = async (req, res) => {
  try {
    const member_id = req.user?.id;
    const { video_id } = req.params;
    if (!member_id || !video_id) {
      return res.status(400).json({ message: 'member_id and video_id are required' });
    }
    const sql = 'DELETE FROM saved_video WHERE member_id = ? AND video_id = ?';
    const [result] = await db.promise().query(sql, [member_id, video_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json({ message: 'Saved video deleted successfully', member_id, video_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};