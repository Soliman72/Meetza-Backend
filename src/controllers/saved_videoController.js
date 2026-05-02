const savedVideoService = require("../services/saved_videoService");

exports.createSavedVideo = async (req, res) => {
  try {
    const data = await savedVideoService.createSavedVideo(req);
    res.status(201).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.getSavedVideosByUserId = async (req, res) => {
  try {
    const data = await savedVideoService.getSavedVideosByUserId(req);
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

exports.getSavedVideoById = async (req, res) => {
  try {
    const payload = await savedVideoService.getSavedVideoById(req);
    res.status(200).json({ success: true, data: payload });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.getAllSavedVideos = async (req, res) => {
  try {
    const data = await savedVideoService.getAllSavedVideos(req);
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

exports.deleteSavedVideo = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { video_id } = req.params;
    const result = await savedVideoService.deleteSavedVideo(user_id, video_id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};
