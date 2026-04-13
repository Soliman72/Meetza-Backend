const homeService = require("../services/homeService");

/**
 * GET /api/home/stats — dashboard cards: videos, meetings, groups, chat unread, saved.
 */
exports.getHomeStats = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }

    const data = await homeService.getHomeStatsData(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

/**
 * GET /api/home/upcoming-meetings?limit=5
 */
exports.getHomeUpcomingMeetings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    if (!homeService.isHomeMeetingsRole(role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const meetings = await homeService.getUpcomingMeetings({
      userId,
      role,
      limit: req.query.limit,
    });

    return res.status(200).json({ success: true, data: meetings });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

/**
 * GET /api/home/most-interested-videos?limit=10
 */
exports.getHomeMostInterestedVideos = async (req, res) => {
    try {
      if (!req.user?.id) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized: user not found" });
      }
  
      const data = await homeService.getMostInterestedVideos(req, req.query.limit);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
  };

/**
 * GET /api/home/leaders?limit=10
 */
exports.getHomeLeaders = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    const data = await homeService.getHomeLeaders(req, req.query.limit);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};