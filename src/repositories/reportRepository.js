const db = require("../config/db");

async function queryRows(sql, params = []) {
  const [rows] = await db.promise().query(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await queryRows(sql, params);
  return rows[0] || null;
}

exports.getMinUserCreatedAt = async () => {
  const row = await queryOne(
    "SELECT MIN(created_at) AS platformStart FROM `user`"
  );
  return row?.platformStart || null;
};

exports.findAccessibleGroups = async (userId, isSuperAdmin) => {
  let sql = "SELECT g.id, g.group_name, g.created_at FROM `group` g";
  const params = [];
  if (!isSuperAdmin) {
    sql += " JOIN group_admin ga ON ga.group_id = g.id WHERE ga.user_id = ?";
    params.push(userId);
  }
  return queryRows(sql, params);
};

exports.findMeetingsInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT 
        m.id, m.title, m.start_time, m.end_time, m.status, m.is_weekly, m.recording,
        g.group_name,
        TIMESTAMPDIFF(MINUTE, m.start_time, m.end_time) as duration,
        (SELECT COUNT(*) FROM meeting_participant WHERE meeting_id = m.id) as attendeeCount
      FROM meeting m
      JOIN \`group\` g ON m.group_id = g.id
      WHERE m.group_id IN (${ph}) AND m.created_at BETWEEN ? AND ?
      ORDER BY m.start_time DESC
    `,
    [...groupIds, start, end]
  );
};

exports.findVideosInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT 
        v.id, v.title, v.created_at, g.group_name,
        TIME_TO_SEC(v.duration) as duration_seconds,
        (SELECT COUNT(*) FROM comment WHERE video_id = v.id) as commentCount,
        (SELECT COUNT(*) FROM \`like\` WHERE video_id = v.id) as likeCount,
        (SELECT COUNT(*) FROM video_watch_progress WHERE video_id = v.id) as viewerCount,
        (SELECT COUNT(*) FROM video_watch_progress WHERE video_id = v.id AND completed = 1) as completionCount,
        (SELECT AVG(progress_seconds) FROM video_watch_progress WHERE video_id = v.id) as avgProgressSeconds,
        EXISTS(SELECT 1 FROM video_transcript_summary WHERE video_id = v.id) as hasSummary
      FROM video v
      JOIN \`group\` g ON v.group_id = g.id
      WHERE v.group_id IN (${ph}) AND v.created_at BETWEEN ? AND ?
      ORDER BY v.created_at DESC
    `,
    [...groupIds, start, end]
  );
};

exports.countMembershipsInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return 0;
  const ph = groupIds.map(() => "?").join(",");
  const row = await queryOne(
    `
      SELECT COUNT(*) as currentMembers FROM group_membership 
      WHERE group_id IN (${ph}) AND created_at BETWEEN ? AND ?
    `,
    [...groupIds, start, end]
  );
  return Number(row?.currentMembers) || 0;
};

exports.countMeetingsInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return 0;
  const ph = groupIds.map(() => "?").join(",");
  const row = await queryOne(
    `
      SELECT COUNT(*) as prevMeetings FROM meeting 
      WHERE group_id IN (${ph}) AND created_at BETWEEN ? AND ?
    `,
    [...groupIds, start, end]
  );
  return Number(row?.prevMeetings) || 0;
};

exports.countVideosInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return 0;
  const ph = groupIds.map(() => "?").join(",");
  const row = await queryOne(
    `
      SELECT COUNT(*) as prevVideos FROM video 
      WHERE group_id IN (${ph}) AND created_at BETWEEN ? AND ?
    `,
    [...groupIds, start, end]
  );
  return Number(row?.prevVideos) || 0;
};

exports.findGroupsDetailed = async (groupIds) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT 
        g.id, g.group_name, g.created_at,
        (SELECT COUNT(*) FROM group_membership WHERE group_id = g.id) as totalMembers,
        (SELECT COUNT(*) FROM meeting WHERE group_id = g.id) as totalMeetings,
        (SELECT COUNT(*) FROM video WHERE group_id = g.id) as totalVideos,
        (SELECT COUNT(*) FROM group_message WHERE group_id = g.id) as totalMessages,
        (SELECT COUNT(*) FROM comment c JOIN video v ON v.id = c.video_id WHERE v.group_id = g.id) as totalComments,
        (SELECT COUNT(*) FROM \`like\` l JOIN video v ON v.id = l.video_id WHERE v.group_id = g.id) as totalLikes
      FROM \`group\` g
      WHERE g.id IN (${ph})
    `,
    [...groupIds]
  );
};

exports.findRecentReviews = async (groupIds, limit = 20) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  return queryRows(
    `
      SELECT 
        c.id, c.comment_text, c.timestamp as created_at,
        u.name as reviewer_name, v.title as video_title, g.group_name
      FROM comment c
      JOIN video v ON c.video_id = v.id
      JOIN \`group\` g ON v.group_id = g.id
      JOIN user u ON c.member_id = u.id
      WHERE v.group_id IN (${ph})
      ORDER BY c.timestamp DESC
      LIMIT ?
    `,
    [...groupIds, lim]
  );
};

exports.findGroupMembershipActivityByPeriod = async (
  groupIds,
  start,
  end,
  mysqlDateFormat
) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT DATE_FORMAT(created_at, '${mysqlDateFormat}') as period, COUNT(*) as count 
      FROM group_membership 
      WHERE group_id IN (${ph}) AND created_at BETWEEN ? AND ?
      GROUP BY period
    `,
    [...groupIds, start, end]
  );
};

exports.findMeetingJoinActivityByPeriod = async (
  groupIds,
  start,
  end,
  mysqlDateFormat
) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT DATE_FORMAT(mp.joined_at, '${mysqlDateFormat}') as period, COUNT(*) as count 
      FROM meeting_participant mp
      JOIN meeting m ON mp.meeting_id = m.id
      WHERE m.group_id IN (${ph}) AND mp.joined_at BETWEEN ? AND ?
      GROUP BY period
    `,
    [...groupIds, start, end]
  );
};

exports.findVideoWatchActivityByPeriod = async (
  groupIds,
  start,
  end,
  mysqlDateFormat
) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT DATE_FORMAT(vwp.updated_at, '${mysqlDateFormat}') as period, COUNT(*) as count 
      FROM video_watch_progress vwp
      JOIN video v ON vwp.video_id = v.id
      WHERE v.group_id IN (${ph}) AND vwp.updated_at BETWEEN ? AND ?
      GROUP BY period
    `,
    [...groupIds, start, end]
  );
};
