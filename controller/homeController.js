const db = require("../config/db");
const { getVideoVisibility } = require("../utils/videoVisibility");
const { buildUnreadTotalQuery } = require("../services/chatMessageService");

/**
 * GET /api/home/stats — dashboard cards: videos, meetings, groups, chat unread, saved.
 */
exports.getHomeStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }

    const vis = getVideoVisibility(req, "v");
    let videoSql = "SELECT COUNT(*) AS c FROM video v";
    const videoParams = [...vis.params];
    if (vis.whereClause) {
      videoSql += ` WHERE ${vis.whereClause}`;
    }

    let meetingSql;
    const meetingParams = [];
    if (role === "Super_Admin") {
      meetingSql = "SELECT COUNT(*) AS c FROM meeting";
    } else if (role === "Administrator") {
      meetingSql = `
        SELECT COUNT(*) AS c FROM meeting m
        WHERE EXISTS (
          SELECT 1 FROM group_admin ga
          WHERE ga.group_id = m.group_id AND ga.user_id = ?
        )
      `;
      meetingParams.push(userId);
    } else {
      meetingSql = `
        SELECT COUNT(*) AS c FROM meeting
        WHERE group_id IN (
          SELECT group_id FROM group_membership WHERE member_id = ?
        )
      `;
      meetingParams.push(userId);
    }

    let groupsSql;
    const groupsParams = [];
    if (role === "Super_Admin") {
      groupsSql = "SELECT COUNT(*) AS c FROM `group`";
    } else if (role === "Administrator") {
      groupsSql =
        "SELECT COUNT(*) AS c FROM group_admin WHERE user_id = ?";
      groupsParams.push(userId);
    } else {
      groupsSql =
        "SELECT COUNT(*) AS c FROM group_membership WHERE member_id = ?";
      groupsParams.push(userId);
    }

    const { sql: unreadSql, params: unreadParamsFn } = buildUnreadTotalQuery(role);
    const unreadParams = unreadParamsFn(userId);

    const savedSql =
      "SELECT COUNT(*) AS c FROM saved_video WHERE member_id = ?";
    const savedParams = [userId];

    const [
      [videoRows],
      [meetingRows],
      [groupsRows],
      [unreadRows],
      [savedRows],
    ] = await Promise.all([
      db.promise().query(videoSql, videoParams),
      db.promise().query(meetingSql, meetingParams),
      db.promise().query(groupsSql, groupsParams),
      db.promise().query(unreadSql, unreadParams),
      db.promise().query(savedSql, savedParams),
    ]);

    const data = {
      video_sessions: Number(videoRows[0]?.c) || 0,
      meetings: Number(meetingRows[0]?.c) || 0,
      groups: Number(groupsRows[0]?.c) || 0,
      group_chat_unread: Number(unreadRows[0]?.c) || 0,
      saved_videos: Number(savedRows[0]?.c) || 0,
    };

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};
