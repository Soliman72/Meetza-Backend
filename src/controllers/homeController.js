const homeService = require("../services/homeService");

const sendError = (res, err) => {
  const status =
    err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const body = { success: false, message: err.message };
  if (status >= 500) body.error = err.message;
  return res.status(status).json(body);
};

exports.getHomeStats = async (req, res) => {
  try {
    const data = await homeService.getHomeStatsData(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getHomeUpcomingMeetings = async (req, res) => {
  try {
    const data = await homeService.getUpcomingMeetings(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getHomeMostInterestedVideos = async (req, res) => {
  try {
    const data = await homeService.getMostInterestedVideos(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getHomeLeaders = async (req, res) => {
  try {
    const data = await homeService.getHomeLeaders(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getHomeSavedVideos = async (req, res) => {
  try {
    const data = await homeService.getHomeSavedVideos(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};
