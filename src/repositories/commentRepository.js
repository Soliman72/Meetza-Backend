const db = require("../config/db");

exports.countByVideoId = async (video_id) => {
  const [rows] = await db.promise().query(
    "SELECT COUNT(*) AS count FROM comment WHERE video_id = ?",
    [video_id]
  );
  return Number(rows[0]?.count) || 0;
};

/** Resolve slug/id and return id, title, administrator_id, group_id, group_name */
exports.getVideoBasicsForComment = async (videoRef) => {
  const [resolved] = await db.promise().query(
    "SELECT id FROM video WHERE id = ? OR slug = ? LIMIT 1",
    [videoRef, videoRef]
  );
  const vid = resolved[0]?.id;
  if (!vid) return null;
  const [rows] = await db.promise().query(
    `SELECT v.id, v.title, v.administrator_id, v.group_id, g.group_name
     FROM video v
     JOIN \`group\` g ON g.id = v.group_id
     WHERE v.id = ?`,
    [vid]
  );
  return rows[0] || null;
};

// CREATE
exports.createComment = async ({ id, user_id, video_id, parent_id, comment_text }) => {
  await db.promise().query(
    `INSERT INTO comment (id, member_id, video_id, parent_id, comment_text)
     VALUES (?, ?, ?, ?, ?)`,
    [id, user_id, video_id, parent_id, comment_text]
  );
};

// GET VIDEO COMMENTS (flat)
exports.getCommentsByVideo = async (video_id) => {
  const [rows] = await db.promise().query(
    `SELECT c.*, u.name AS member_name, u.user_photo AS member_photo
     FROM comment c
     JOIN user u ON c.member_id = u.id
     WHERE c.video_id = ?
     ORDER BY c.timestamp ASC`,
    [video_id]
  );

  return rows;
};

// GET BY ID
exports.getCommentById = async (id) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM comment WHERE id = ?",
    [id]
  );
  return rows[0];
};

// USER COMMENTS
exports.getCommentsByUser = async (user_id) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM comment WHERE member_id = ?",
    [user_id]
  );
  return rows;
};

// UPDATE
exports.updateComment = async (id, text) => {
  const [result] = await db.promise().query(
    "UPDATE comment SET comment_text = ? WHERE id = ?",
    [text, id]
  );
  return result.affectedRows;
};

// DELETE
exports.deleteComment = async (id) => {
  const [result] = await db.promise().query(
    "DELETE FROM comment WHERE id = ?",
    [id]
  );
  return result.affectedRows;
};