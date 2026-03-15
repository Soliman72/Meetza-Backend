const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { createNotification } = require("../services/notificationService");

// Create (comment or reply: pass optional parent_id to reply to a comment)
exports.createComment = async (req, res) => {
  try {
    const { video_id, comment_text, parent_id } = req.body;
    const user_id = req.user?.id;
    const id = uuidv4();

    if (!user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found" });
    }
    if (!video_id || !comment_text) {
      return res.status(400).json({ success: false, message: "video_id and comment_text are required" });
    }

    const [videoRows] = await db
      .promise()
      .query("SELECT id, administrator_id, title FROM video WHERE id = ?", [video_id]);
    if (videoRows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid video_id: not found" });
    }
    const video = videoRows[0];

    let parentCommentMemberId = null;
    if (parent_id) {
      const [parentRows] = await db
        .promise()
        .query("SELECT id, video_id, member_id FROM comment WHERE id = ?", [parent_id]);
      if (parentRows.length === 0) {
        return res.status(400).json({ success: false, message: "parent_id: comment not found" });
      }
      if (parentRows[0].video_id !== video_id) {
        return res.status(400).json({ success: false, message: "parent comment must belong to the same video" });
      }
      parentCommentMemberId = parentRows[0].member_id;
    }

    const sql =
      "INSERT INTO comment (id, member_id, video_id, parent_id, comment_text) VALUES (?, ?, ?, ?, ?)";
    await db.promise().query(sql, [id, user_id, video_id, parent_id || null, comment_text]);

    // Notifications (non-blocking)
    const [commenter] = await db.promise().query("SELECT name FROM user WHERE id = ?", [user_id]);
    const commenterName = commenter?.length ? commenter[0].name : "Someone";

    try {
      const videoOwnerId = video.administrator_id;
      const [videoOwnerIsMember] = await db
        .promise()
        .query("SELECT user_id FROM member WHERE user_id = ?", [videoOwnerId]);

      if (parent_id) {
        // Notify parent comment owner about the reply (only if not replying to self)
        if (parentCommentMemberId && parentCommentMemberId !== user_id) {
          await createNotification({
            senderId: user_id,
            memberId: parentCommentMemberId,
            title: "Reply to your comment",
            message: `${commenterName} replied to your comment on the video "${video.title}".`,
          });
        }
        // Notify video owner about the reply (if member, not the replier, and not the parent comment owner to avoid duplicate)
        if (
          videoOwnerIsMember.length > 0 &&
          videoOwnerId !== user_id &&
          videoOwnerId !== parentCommentMemberId
        ) {
          await createNotification({
            senderId: user_id,
            memberId: videoOwnerId,
            title: "New reply on your video",
            message: `${commenterName} replied to a comment on your video "${video.title}".`,
          });
        }
      } else {
        // Notify video owner about new comment (only if they are a member and not commenting on own video)
        if (videoOwnerId !== user_id && videoOwnerIsMember.length > 0) {
          await createNotification({
            senderId: user_id,
            memberId: videoOwnerId,
            title: "New comment on your video",
            message: `${commenterName} commented on your video "${video.title}".`,
          });
        }
      }
    } catch (notifyErr) {
      console.error("Comment notification error:", notifyErr);
    }

    res.status(201).json({ success: true, data: { id, user_id, video_id, parent_id: parent_id || null, comment_text } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Read all comments for a video (top-level + replies nested under each comment)
exports.getCommentsByVideoId = async (req, res) => {
  try {
    const { video_id } = req.params;
    if (!video_id) {
      return res.status(400).json({ message: "video_id is required" });
    }
    const sqlCount = "SELECT COUNT(*) as count FROM comment WHERE video_id = ?";
    const [countRows] = await db.promise().query(sqlCount, [video_id]);
    const commentCount = countRows[0].count;

    const [rows] = await db
      .promise()
      .query(
        'SELECT comment.*, user.name as "member_name", user.user_photo as "Member_photo" FROM comment JOIN user ON comment.member_id = user.id WHERE comment.video_id = ? ORDER BY comment.timestamp ASC',
        [video_id]
      );

    const byId = {};
    rows.forEach((r) => {
      byId[r.id] = { ...r, replies: [] };
    });
    const topLevel = [];
    rows.forEach((r) => {
      const item = byId[r.id];
      if (r.parent_id && byId[r.parent_id]) {
        byId[r.parent_id].replies.push(item);
      } else {
        topLevel.push(item);
      }
    });

    res.status(200).json({ success: true, data: { commentCount, comments: topLevel } });
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

// Read by user_id
exports.getCommentsByUserId = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }
    const [rows] = await db
      .promise()
      .query("SELECT * FROM comment WHERE member_id = ?", [user_id]);
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
