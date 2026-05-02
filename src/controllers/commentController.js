const commentService = require("../services/commentService");
const commentValidator = require("../validators/commentValidator");

exports.createComment = async (req, res) => {
  try {
    const result = await commentService.createComment(req);
    return res.status(result.status).json(result.body);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Error",
      ...(err.status === 500 && err.message ? { error: err.message } : {}),
    });
  }
};

exports.getCommentsByVideoId = async (req, res) => {
  try {
    const { video_id } = req.params;
    const { commentCount, comments } =
      await commentService.getCommentsByVideoId(video_id);
    res.status(200).json({ success: true, data: { commentCount, comments } });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.getCommentById = async (req, res) => {
  try {
    const row = await commentService.getCommentById(req.params.id);
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.getCommentsByUserId = async (req, res) => {
  try {
    commentValidator.validateAuthenticatedUser(req);
    const rows = await commentService.getCommentsByUserId(req.user.id);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text } = req.body;
    const data = await commentService.updateComment(id, comment_text);
    res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    await commentService.deleteComment(req.params.id);
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};
