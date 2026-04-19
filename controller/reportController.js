const db = require("../config/db");

/**
 * Analytics Report for Admins with Progress Comparison
 * GET /api/reports/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
exports.getAnalyticsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    const isSuperAdmin = req.isSuperAdmin || req.user.role === "Super_Admin";

    // --- 1. SET UP TIME PERIODS ---
    let start, end, isAllTime = false;

    // Determine the actual end date
    end = endDate ? new Date(endDate) : new Date();

    if (startDate) {
      start = new Date(startDate);
    } else {
      // Default to "All Time" - fetch earliest activity
      isAllTime = true;
      const [[dateRow]] = await db.promise().query("SELECT MIN(created_at) as platformStart FROM `user` ");
      start = (dateRow && dateRow.platformStart) ? new Date(dateRow.platformStart) : new Date('2024-01-01');
    }

    // Determine Grouping Strategy for Graphs
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    const groupBy = (isAllTime || diffDays > 90) ? 'month' : 'day';
    const mysqlDateFormat = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

    // Identify Accessible Groups
    let groupSql = "SELECT g.id, g.group_name, g.created_at FROM `group` g";
    let groupParams = [];
    if (!isSuperAdmin) {
      groupSql += " JOIN group_admin ga ON ga.group_id = g.id WHERE ga.user_id = ?";
      groupParams.push(userId);
    }
    const [baseGroups] = await db.promise().query(groupSql, groupParams);

    if (baseGroups.length === 0) {
      return res.status(200).json({ success: true, data: null, message: "No groups found." });
    }

    const groupIds = baseGroups.map(g => g.id);
    const placeholders = groupIds.map(() => "?").join(",");

    // --- 2. FETCH CURRENT PERIOD DATA ---

    // Meetings
    const [meetings] = await db.promise().query(`
      SELECT 
        m.id, m.title, m.start_time, m.end_time, m.status, m.is_weekly, m.recording,
        g.group_name,
        TIMESTAMPDIFF(MINUTE, m.start_time, m.end_time) as duration,
        (SELECT COUNT(*) FROM meeting_participant WHERE meeting_id = m.id) as attendeeCount
      FROM meeting m
      JOIN \`group\` g ON m.group_id = g.id
      WHERE m.group_id IN (${placeholders}) AND m.created_at BETWEEN ? AND ?
      ORDER BY m.start_time DESC
    `, [...groupIds, start, end]);

    // Videos
    const [videos] = await db.promise().query(`
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
      WHERE v.group_id IN (${placeholders}) AND v.created_at BETWEEN ? AND ?
      ORDER BY v.created_at DESC
    `, [...groupIds, start, end]);

    // New Members
    const [[{ currentMembers }]] = await db.promise().query(`
      SELECT COUNT(*) as currentMembers FROM group_membership 
      WHERE group_id IN (${placeholders}) AND created_at BETWEEN ? AND ?
    `, [...groupIds, start, end]);

    // --- 3. FETCH PREVIOUS PERIOD DATA (If not All-Time) ---
    let prevMeetings = 0, prevVideos = 0, prevMembers = 0, prevStart, prevEnd;

    if (!isAllTime) {
      const durationMs = end.getTime() - start.getTime();
      prevEnd = new Date(start.getTime());
      prevStart = new Date(start.getTime() - durationMs);

      const [[mResult]] = await db.promise().query(`
        SELECT COUNT(*) as prevMeetings FROM meeting 
        WHERE group_id IN (${placeholders}) AND created_at BETWEEN ? AND ?
      `, [...groupIds, prevStart, prevEnd]);
      prevMeetings = mResult.prevMeetings;

      const [[vResult]] = await db.promise().query(`
        SELECT COUNT(*) as prevVideos FROM video 
        WHERE group_id IN (${placeholders}) AND created_at BETWEEN ? AND ?
      `, [...groupIds, prevStart, prevEnd]);
      prevVideos = vResult.prevVideos;

      const [[memResult]] = await db.promise().query(`
        SELECT COUNT(*) as prevMembers FROM group_membership 
        WHERE group_id IN (${placeholders}) AND created_at BETWEEN ? AND ?
      `, [...groupIds, prevStart, prevEnd]);
      prevMembers = memResult.prevMembers;
    }

    // --- 4. PER-GROUP DETAILED METRICS ---
    const [groupsDetailed] = await db.promise().query(`
      SELECT 
        g.id, g.group_name, g.created_at,
        (SELECT COUNT(*) FROM group_membership WHERE group_id = g.id) as totalMembers,
        (SELECT COUNT(*) FROM meeting WHERE group_id = g.id) as totalMeetings,
        (SELECT COUNT(*) FROM video WHERE group_id = g.id) as totalVideos,
        (SELECT COUNT(*) FROM group_message WHERE group_id = g.id) as totalMessages,
        (SELECT COUNT(*) FROM comment c JOIN video v ON v.id = c.video_id WHERE v.group_id = g.id) as totalComments,
        (SELECT COUNT(*) FROM \`like\` l JOIN video v ON v.id = l.video_id WHERE v.group_id = g.id) as totalLikes
      FROM \`group\` g
      WHERE g.id IN (${placeholders})
    `, [...groupIds]);

    // --- 5. RECENT REVIEWS ---
    const [recentReviews] = await db.promise().query(`
      SELECT 
        c.id, c.comment_text, c.timestamp as created_at,
        u.name as reviewer_name, v.title as video_title, g.group_name
      FROM comment c
      JOIN video v ON c.video_id = v.id
      JOIN \`group\` g ON v.group_id = g.id
      JOIN user u ON c.member_id = u.id
      WHERE v.group_id IN (${placeholders})
      ORDER BY c.timestamp DESC
      LIMIT 20
    `, [...groupIds]);

    // --- 5.5. FETCH ACTIVITY TRENDS ---
    const [groupActivity] = await db.promise().query(`
      SELECT DATE_FORMAT(created_at, '${mysqlDateFormat}') as period, COUNT(*) as count 
      FROM group_membership 
      WHERE group_id IN (${placeholders}) AND created_at BETWEEN ? AND ?
      GROUP BY period
    `, [...groupIds, start, end]);

    const [meetingActivity] = await db.promise().query(`
      SELECT DATE_FORMAT(mp.joined_at, '${mysqlDateFormat}') as period, COUNT(*) as count 
      FROM meeting_participant mp
      JOIN meeting m ON mp.meeting_id = m.id
      WHERE m.group_id IN (${placeholders}) AND mp.joined_at BETWEEN ? AND ?
      GROUP BY period
    `, [...groupIds, start, end]);

    const [videoActivity] = await db.promise().query(`
      SELECT DATE_FORMAT(vwp.updated_at, '${mysqlDateFormat}') as period, COUNT(*) as count 
      FROM video_watch_progress vwp
      JOIN video v ON vwp.video_id = v.id
      WHERE v.group_id IN (${placeholders}) AND vwp.updated_at BETWEEN ? AND ?
      GROUP BY period
    `, [...groupIds, start, end]);

    // Build the Trends Map
    const trendsMap = {};
    let curr = new Date(start);
    if (groupBy === 'month') curr.setDate(1); // Avoid day 31 skipping shorter months

    while (curr <= end) {
      let d;
      if (groupBy === 'month') {
        d = curr.toISOString().slice(0, 7); // YYYY-MM
        trendsMap[d] = { date: d, groups: 0, meetings: 0, videos: 0 };
        curr.setMonth(curr.getMonth() + 1);
      } else {
        d = curr.toISOString().split('T')[0]; // YYYY-MM-DD
        trendsMap[d] = { date: d, groups: 0, meetings: 0, videos: 0 };
        curr.setDate(curr.getDate() + 1);
      }
    }

    groupActivity.forEach(r => { if (trendsMap[r.period]) trendsMap[r.period].groups = r.count; });
    meetingActivity.forEach(r => { if (trendsMap[r.period]) trendsMap[r.period].meetings = r.count; });
    videoActivity.forEach(r => { if (trendsMap[r.period]) trendsMap[r.period].videos = r.count; });

    const activityTrends = Object.values(trendsMap).sort((a, b) => a.date.localeCompare(b.date));

    // --- 6. CALCULATE FINAL RESULTS ---

    // Summary Aggregates
    const totalMembersAllTime = groupsDetailed.reduce((sum, g) => sum + g.totalMembers, 0);
    const totalMessages = groupsDetailed.reduce((sum, g) => sum + g.totalMessages, 0);
    const totalComments = groupsDetailed.reduce((sum, g) => sum + g.totalComments, 0);
    const totalLikes = groupsDetailed.reduce((sum, g) => sum + g.totalLikes, 0);

    const recordedMeetings = meetings.filter(m => m.recording === '1').length;
    const avgDuration = meetings.length > 0
      ? Math.round(meetings.reduce((sum, m) => sum + (m.duration || 0), 0) / meetings.length)
      : 0;
    const avgAttendance = meetings.length > 0
      ? Math.round((meetings.reduce((sum, m) => sum + m.attendeeCount, 0) / meetings.length) * 10) / 10
      : 0;

    // Enhance videos with progress metrics
    const videosWithProgress = videos.map(v => {
      const duration = Number(v.duration_seconds) || 0;
      const avgProg = Number(v.avgProgressSeconds) || 0;
      let avgProgressPercent = 0;
      if (duration > 0) {
        avgProgressPercent = Math.min(100, Math.round((avgProg / duration) * 100));
      }
      return {
        ...v,
        avgProgressPercent,
        completionRate: v.viewerCount > 0 ? Math.round((v.completionCount / v.viewerCount) * 100) : 0
      };
    });

    // Distributions
    const meetingStatus = meetings.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});

    // --- 7. FINAL RESPONSE ---
    res.status(200).json({
      success: true,
      data: {
        filters: { start, end, prevStart, prevEnd },
        summary: {
          totalGroups: groupsDetailed.length,
          totalMembers: totalMembersAllTime,
          totalMeetings: meetings.length,
          totalVideos: videos.length,
          totalMessages,
          totalComments,
          totalLikes,
          totalReviews: totalComments + totalLikes,
          avgMeetingDuration: avgDuration,
          recordedMeetings,
          avgAttendance
        },
        comparison: {
          meetings: { current: meetings.length, previous: prevMeetings },
          videos: { current: videos.length, previous: prevVideos },
          members: { current: currentMembers, previous: prevMembers }
        },
        distributions: { meetingStatus },
        activityTrends,
        groups: groupsDetailed,
        meetings,
        videos: videosWithProgress,
        reviews: recentReviews
      }
    });

  } catch (err) {
    console.error("[analytics] Error:", err);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message
    });
  }
};
