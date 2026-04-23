const reportRepo = require("../repositories/reportRepository");
const reportValidator = require("../validators/reportValidator");

function buildActivityTrends(
  { start, end, groupBy },
  { groupActivity, meetingActivity, videoActivity }
) {
  const trendsMap = {};
  let curr = new Date(start);
  if (groupBy === "month") curr.setDate(1);

  while (curr <= end) {
    let d;
    if (groupBy === "month") {
      d = curr.toISOString().slice(0, 7);
      trendsMap[d] = { date: d, groups: 0, meetings: 0, videos: 0 };
      curr.setMonth(curr.getMonth() + 1);
    } else {
      d = curr.toISOString().split("T")[0];
      trendsMap[d] = { date: d, groups: 0, meetings: 0, videos: 0 };
      curr.setDate(curr.getDate() + 1);
    }
  }

  groupActivity.forEach((r) => {
    if (trendsMap[r.period]) trendsMap[r.period].groups = r.count;
  });
  meetingActivity.forEach((r) => {
    if (trendsMap[r.period]) trendsMap[r.period].meetings = r.count;
  });
  videoActivity.forEach((r) => {
    if (trendsMap[r.period]) trendsMap[r.period].videos = r.count;
  });

  return Object.values(trendsMap).sort((a, b) => a.date.localeCompare(b.date));
}

exports.getAnalyticsReport = async (req) => {
  const { startDate, endDate } = req.query;
  const userId = req.user.id;
  const isSuperAdmin =
    req.isSuperAdmin || req.user.role === "Super_Admin";

  let end = endDate ? new Date(endDate) : new Date();
  let start;
  let isAllTime = false;

  if (startDate) {
    start = new Date(startDate);
  } else {
    isAllTime = true;
    const platformMin = await reportRepo.getMinUserCreatedAt();
    start = platformMin ? new Date(platformMin) : new Date("2024-01-01");
  }

  reportValidator.assertStartBeforeEnd(start, end);

  const diffDays = Math.ceil(
    Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const { groupBy, mysqlDateFormat } = reportValidator.resolveTrendDateFormat(
    isAllTime,
    diffDays
  );

  const baseGroups = await reportRepo.findAccessibleGroups(
    userId,
    isSuperAdmin
  );

  if (baseGroups.length === 0) {
    return {
      empty: true,
      message: "No groups found.",
      data: null,
    };
  }

  const groupIds = baseGroups.map((g) => g.id);

  const [meetings, videos, currentMembers] = await Promise.all([
    reportRepo.findMeetingsInPeriod(groupIds, start, end),
    reportRepo.findVideosInPeriod(groupIds, start, end),
    reportRepo.countMembershipsInPeriod(groupIds, start, end),
  ]);

  let prevMeetings = 0;
  let prevVideos = 0;
  let prevMembers = 0;
  let prevStart;
  let prevEnd;

  if (!isAllTime) {
    const durationMs = end.getTime() - start.getTime();
    prevEnd = new Date(start.getTime());
    prevStart = new Date(start.getTime() - durationMs);

    [prevMeetings, prevVideos, prevMembers] = await Promise.all([
      reportRepo.countMeetingsInPeriod(groupIds, prevStart, prevEnd),
      reportRepo.countVideosInPeriod(groupIds, prevStart, prevEnd),
      reportRepo.countMembershipsInPeriod(groupIds, prevStart, prevEnd),
    ]);
  }

  const [groupsDetailed, recentReviews, groupActivity, meetingActivity, videoActivity] =
    await Promise.all([
      reportRepo.findGroupsDetailed(groupIds),
      reportRepo.findRecentReviews(groupIds, 20),
      reportRepo.findGroupMembershipActivityByPeriod(
        groupIds,
        start,
        end,
        mysqlDateFormat
      ),
      reportRepo.findMeetingJoinActivityByPeriod(
        groupIds,
        start,
        end,
        mysqlDateFormat
      ),
      reportRepo.findVideoWatchActivityByPeriod(
        groupIds,
        start,
        end,
        mysqlDateFormat
      ),
    ]);

  const activityTrends = buildActivityTrends(
    { start, end, groupBy },
    { groupActivity, meetingActivity, videoActivity }
  );

  const totalMembersAllTime = groupsDetailed.reduce(
    (sum, g) => sum + g.totalMembers,
    0
  );
  const totalMessages = groupsDetailed.reduce(
    (sum, g) => sum + g.totalMessages,
    0
  );
  const totalComments = groupsDetailed.reduce(
    (sum, g) => sum + g.totalComments,
    0
  );
  const totalLikes = groupsDetailed.reduce((sum, g) => sum + g.totalLikes, 0);

  const recordedMeetings = meetings.filter((m) => m.recording === "1").length;
  const avgDuration =
    meetings.length > 0
      ? Math.round(
          meetings.reduce((sum, m) => sum + (m.duration || 0), 0) /
            meetings.length
        )
      : 0;
  const avgAttendance =
    meetings.length > 0
      ? Math.round(
          (meetings.reduce((sum, m) => sum + m.attendeeCount, 0) /
            meetings.length) *
            10
        ) / 10
      : 0;

  const videosWithProgress = videos.map((v) => {
    const duration = Number(v.duration_seconds) || 0;
    const avgProg = Number(v.avgProgressSeconds) || 0;
    let avgProgressPercent = 0;
    if (duration > 0) {
      avgProgressPercent = Math.min(
        100,
        Math.round((avgProg / duration) * 100)
      );
    }
    return {
      ...v,
      avgProgressPercent,
      completionRate:
        v.viewerCount > 0
          ? Math.round((v.completionCount / v.viewerCount) * 100)
          : 0,
    };
  });

  const meetingStatus = meetings.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});

  return {
    empty: false,
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
        avgAttendance,
      },
      comparison: {
        meetings: { current: meetings.length, previous: prevMeetings },
        videos: { current: videos.length, previous: prevVideos },
        members: { current: currentMembers, previous: prevMembers },
      },
      distributions: { meetingStatus },
      activityTrends,
      groups: groupsDetailed,
      meetings,
      videos: videosWithProgress,
      reviews: recentReviews,
    },
  };
};
