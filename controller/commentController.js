const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

// Create
exports.createComment = async (req, res) => {
  try {
    const { video_id, comment_text } = req.body;
    const member_id = req.user?.id;
    const id = uuidv4();

    // Validate required fields
    if (!member_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: member not found" });
    }
    if (!video_id || !comment_text) {
      return res.status(400).json({ success: false, message: "video_id and comment_text are required" });
    }
    // Check if video exists
    const [videoExists] = await db
      .promise()
      .query("SELECT id FROM video WHERE id = ?", [video_id]);
    if (videoExists.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid video_id: not found" });
    }
    const sql =
      "INSERT INTO comment (id, member_id, video_id, comment_text) VALUES (?, ?, ?, ?)";
    const rows = await db.promise().query(sql, [id, member_id, video_id, comment_text]);
    const [newComment] = rows;
    res.status(201).json({ success: true, data: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Read all comments for a video
exports.getCommentsByVideoId = async (req, res) => {
  try {
    const { video_id } = req.params;
    if (!video_id) {
      return res.status(400).json({ message: "video_id is required" });
    }
    // respond with number of comments
    const sqlCount = "SELECT COUNT(*) as count FROM comment WHERE video_id = ?";
    const [countRows] = await db.promise().query(sqlCount, [video_id]);
    const commentCount = countRows[0].count;
    const [rows] = await db
      .promise()
      .query(
        'SELECT comment.*, user.name as "member_name", user.user_photo as "Member_photo" FROM comment JOIN user ON comment.member_id=user.id WHERE video_id = ?',
        [video_id]
      );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, data: { commentCount, comments: rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Read by id
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    const [rows] = await db
      .promise()
      .query("SELECT * FROM comment WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Read by member_id
exports.getCommentsByMemberId = async (req, res) => {
  try {
    const member_id = req.user?.id;
    if (!member_id) {
      return res.status(400).json({ success: false, message: "member_id is required" });
    }
    const [rows] = await db
      .promise()
      .query("SELECT * FROM comment WHERE member_id = ?", [member_id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Update
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text } = req.body;
    if (!id || !comment_text) {
      return res
        .status(400)
        .json({ success: false, message: "id and comment_text are required" });
    }
    const sql = "UPDATE comment SET comment_text = ? WHERE id = ?";
    const [result] = await db.promise().query(sql, [comment_text, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, data: { id, comment_text } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Delete
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }
    const sql = "DELETE FROM comment WHERE id = ?";
    const [result] = await db.promise().query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};
