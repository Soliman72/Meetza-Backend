const db = require("../config/db");
const { resolveSafeDateFormat } = require("../utils/sqlSafety");

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
    "SELECT MIN(created_at) AS platformStart FROM `user`",
  );
  return row?.platformStart || null;
};

exports.findAccessibleGroups = async (userId, isSuperAdmin) => {
  let sql =
    "SELECT g.id, g.group_name, g.group_photo, g.created_at FROM `group` g";
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
        m.poster_url,
        g.group_name,
        TIMESTAMPDIFF(MINUTE, m.start_time, m.end_time) as duration,
        COALESCE(mp.attendeeCount, 0) as attendeeCount
      FROM meeting m
      JOIN \`group\` g ON m.group_id = g.id
      LEFT JOIN (
        SELECT meeting_id, COUNT(*) as attendeeCount FROM meeting_participant GROUP BY meeting_id
      ) mp ON mp.meeting_id = m.id
      WHERE m.group_id IN (${ph}) AND m.created_at BETWEEN ? AND ?
      ORDER BY m.start_time DESC
    `,
    [...groupIds, start, end],
  );
};

exports.findVideosInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT 
        v.id, v.title, v.created_at, v.poster_url, g.group_name,
        TIME_TO_SEC(v.duration) as duration_seconds,
        COALESCE(c.commentCount, 0) as commentCount,
        COALESCE(l.likeCount, 0) as likeCount,
        COALESCE(vwp.viewerCount, 0) as viewerCount,
        COALESCE(vwp.completionCount, 0) as completionCount,
        COALESCE(vwp.avgProgressSeconds, 0) as avgProgressSeconds,
        CASE WHEN vts.video_id IS NOT NULL THEN 1 ELSE 0 END as hasSummary
      FROM video v
      JOIN \`group\` g ON v.group_id = g.id
      LEFT JOIN (
        SELECT video_id, COUNT(*) as commentCount FROM comment GROUP BY video_id
      ) c ON c.video_id = v.id
      LEFT JOIN (
        SELECT video_id, COUNT(*) as likeCount FROM \`like\` GROUP BY video_id
      ) l ON l.video_id = v.id
      LEFT JOIN (
        SELECT 
          video_id, 
          COUNT(*) as viewerCount, 
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completionCount,
          AVG(progress_seconds) as avgProgressSeconds
        FROM video_watch_progress 
        GROUP BY video_id
      ) vwp ON vwp.video_id = v.id
      LEFT JOIN (
        SELECT DISTINCT video_id FROM video_transcript_summary
      ) vts ON vts.video_id = v.id
      WHERE v.group_id IN (${ph}) AND v.created_at BETWEEN ? AND ?
      ORDER BY v.created_at DESC
    `,
    [...groupIds, start, end],
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
    [...groupIds, start, end],
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
    [...groupIds, start, end],
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
    [...groupIds, start, end],
  );
  return Number(row?.prevVideos) || 0;
};

exports.countGroupsInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return 0;
  const ph = groupIds.map(() => "?").join(",");
  const row = await queryOne(
    `
      SELECT COUNT(*) as prevGroups FROM \`group\`
      WHERE id IN (${ph}) AND created_at BETWEEN ? AND ?
    `,
    [...groupIds, start, end],
  );
  return Number(row?.prevGroups) || 0;
};

exports.countMessagesInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return 0;
  const ph = groupIds.map(() => "?").join(",");
  const row = await queryOne(
    `
      SELECT COUNT(*) as prevMessages FROM group_message
      WHERE group_id IN (${ph}) AND created_at BETWEEN ? AND ?
    `,
    [...groupIds, start, end],
  );
  return Number(row?.prevMessages) || 0;
};

exports.countMeetingAttendanceInPeriod = async (groupIds, start, end) => {
  if (!groupIds.length) return 0;
  const ph = groupIds.map(() => "?").join(",");
  const row = await queryOne(
    `
      SELECT COUNT(*) as prevAttendance FROM meeting_participant mp
      JOIN meeting m ON mp.meeting_id = m.id
      WHERE m.group_id IN (${ph}) AND mp.joined_at BETWEEN ? AND ?
    `,
    [...groupIds, start, end],
  );
  return Number(row?.prevAttendance) || 0;
};

exports.findGroupsDetailed = async (groupIds, start, end) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT 
        g.id, g.group_name, g.group_photo, g.created_at,
        COALESCE(gm.totalMembers, 0) as totalMembers,
        COALESCE(m.totalMeetings, 0) as totalMeetings,
        COALESCE(v.totalVideos, 0) as totalVideos,
        COALESCE(msg.totalMessages, 0) as totalMessages,
        COALESCE(c.totalComments, 0) as totalComments,
        COALESCE(l.totalLikes, 0) as totalLikes
      FROM \`group\` g
      LEFT JOIN (
        SELECT group_id, COUNT(*) as totalMembers FROM group_membership WHERE created_at BETWEEN ? AND ? GROUP BY group_id
      ) gm ON gm.group_id = g.id
      LEFT JOIN (
        SELECT group_id, COUNT(*) as totalMeetings FROM meeting WHERE created_at BETWEEN ? AND ? GROUP BY group_id
      ) m ON m.group_id = g.id
      LEFT JOIN (
        SELECT group_id, COUNT(*) as totalVideos FROM video WHERE created_at BETWEEN ? AND ? GROUP BY group_id
      ) v ON v.group_id = g.id
      LEFT JOIN (
        SELECT group_id, COUNT(*) as totalMessages FROM group_message WHERE created_at BETWEEN ? AND ? GROUP BY group_id
      ) msg ON msg.group_id = g.id
      LEFT JOIN (
        SELECT v.group_id, COUNT(*) as totalComments FROM comment c JOIN video v ON v.id = c.video_id WHERE c.timestamp BETWEEN ? AND ? GROUP BY v.group_id
      ) c ON c.group_id = g.id
      LEFT JOIN (
        SELECT v.group_id, COUNT(*) as totalLikes FROM \`like\` l JOIN video v ON v.id = l.video_id WHERE l.created_at BETWEEN ? AND ? GROUP BY v.group_id
      ) l ON l.group_id = g.id
      WHERE g.id IN (${ph})
    `,
    [
      start, end,
      start, end,
      start, end,
      start, end,
      start, end,
      start, end,
      ...groupIds,
    ],
  );
};

exports.findRecentReviews = async (groupIds, start, end, limit = 20) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  return queryRows(
    `
      SELECT 
        c.id, c.comment_text, c.timestamp as created_at,
        u.name as reviewer_name, u.user_photo as reviewer_photo,
        v.title as video_title, v.poster_url as video_poster,
        g.group_name
      FROM comment c
      JOIN video v ON c.video_id = v.id
      JOIN \`group\` g ON v.group_id = g.id
      JOIN user u ON c.member_id = u.id
      WHERE v.group_id IN (${ph}) AND c.timestamp BETWEEN ? AND ?
      ORDER BY c.timestamp DESC
      LIMIT ?
    `,
    [...groupIds, start, end, lim],
  );
};

exports.findRecentMembers = async (groupIds, start, end, limit = 20) => {
  if (!groupIds.length) return [];
  const ph = groupIds.map(() => "?").join(",");
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  return queryRows(
    `
      SELECT 
        u.id, u.name, u.user_photo, u.email,
        gm.created_at as joined_at, g.group_name
      FROM group_membership gm
      JOIN user u ON u.id = gm.member_id
      JOIN \`group\` g ON g.id = gm.group_id
      WHERE gm.group_id IN (${ph}) AND gm.created_at BETWEEN ? AND ?
      ORDER BY gm.created_at DESC
      LIMIT ?
    `,
    [...groupIds, start, end, lim],
  );
};

exports.findGroupMembershipActivityByPeriod = async (
  groupIds,
  start,
  end,
  mysqlDateFormat,
) => {
  if (!groupIds.length) return [];
  const safeDateFormat = resolveSafeDateFormat(mysqlDateFormat);
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT DATE_FORMAT(created_at, '${safeDateFormat}') as period, COUNT(*) as count 
      FROM group_membership 
      WHERE group_id IN (${ph}) AND created_at BETWEEN ? AND ?
      GROUP BY period
    `,
    [...groupIds, start, end],
  );
};

exports.findMeetingJoinActivityByPeriod = async (
  groupIds,
  start,
  end,
  mysqlDateFormat,
) => {
  if (!groupIds.length) return [];
  const safeDateFormat = resolveSafeDateFormat(mysqlDateFormat);
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT DATE_FORMAT(mp.joined_at, '${safeDateFormat}') as period, COUNT(*) as count 
      FROM meeting_participant mp
      JOIN meeting m ON mp.meeting_id = m.id
      WHERE m.group_id IN (${ph}) AND mp.joined_at BETWEEN ? AND ?
      GROUP BY period
    `,
    [...groupIds, start, end],
  );
};

exports.findVideoWatchActivityByPeriod = async (
  groupIds,
  start,
  end,
  mysqlDateFormat,
) => {
  if (!groupIds.length) return [];
  const safeDateFormat = resolveSafeDateFormat(mysqlDateFormat);
  const ph = groupIds.map(() => "?").join(",");
  return queryRows(
    `
      SELECT DATE_FORMAT(vwp.updated_at, '${safeDateFormat}') as period, COUNT(*) as count 
      FROM video_watch_progress vwp
      JOIN video v ON vwp.video_id = v.id
      WHERE v.group_id IN (${ph}) AND vwp.updated_at BETWEEN ? AND ?
      GROUP BY period
    `,
    [...groupIds, start, end],
  );
};
