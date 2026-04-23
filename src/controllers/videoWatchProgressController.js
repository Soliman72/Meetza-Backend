const videoWatchProgressService = require("../services/videoWatchProgressService");

const sendError = (res, err) => {
  const status =
    err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const body = { success: false, message: err.message };
  if (status >= 500) body.error = err.message;
  return res.status(status).json(body);
};

exports.listMyWatchProgress = async (req, res) => {
  try {
    const data = await videoWatchProgressService.listByUser(req, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getWatchProgressByVideoId = async (req, res) => {
  try {
    const data = await videoWatchProgressService.getWatchProgressForRequest(
      req,
      req.params.id
    );
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.upsertWatchProgress = async (req, res) => {
  try {
    const data = await videoWatchProgressService.upsertWatchProgressForRequest(
      req,
      req.params.id
    );
    return res.status(200).json({
      success: true,
      message: "Watch progress saved",
      data,
    });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.deleteWatchProgress = async (req, res) => {
  try {
    await videoWatchProgressService.deleteWatchProgressForRequest(
      req,
      req.params.id
    );
    return res.status(200).json({
      success: true,
      message: "Watch progress removed",
    });
  } catch (err) {
    return sendError(res, err);
  }
};
