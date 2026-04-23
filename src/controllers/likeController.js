const likeService = require("../services/likeService");
const likeValidator = require("../validators/likeValidator");

exports.createLike = async (req, res) => {
  try {
    const result = await likeService.createLike(req);
    return res.status(result.status).json(result.body);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.getLikesByVideoId = async (req, res) => {
  try {
    const { video_id } = req.params;
    const { likeCounts, data } = await likeService.getLikesByVideoId(video_id);
    return res.status(200).json({ success: true, likeCounts, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.getLikesByUserId = async (req, res) => {
  try {
    likeValidator.validateAuthenticatedUser(req);
    const results = await likeService.getLikesByUserId(req.user.id);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.updateLike = async (req, res) => {
  try {
    const out = await likeService.updateLike(req);
    return res.status(200).json({ success: true, message: out.message });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.deleteLike = async (req, res) => {
  try {
    likeValidator.validateAuthenticatedUser(req);
    const { video_id } = req.params;
    const out = await likeService.deleteLike(req.user.id, video_id);
    return res.status(200).json({ success: true, message: out.message });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};
