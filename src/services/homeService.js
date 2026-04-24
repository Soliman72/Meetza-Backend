const { getVideoVisibility } = require("../utils/videoVisibility");
const { mapWatchProgressFromRow } = require("../utils/videoWatchProgressFields");
const { buildVideoSearchCondition } = require("../utils/videoSearch");
const { buildUnreadTotalQuery } = require("./chatMessageService");
const homeRepo = require("../repositories/homeRepository");
const homeValidator = require("../validators/homeValidator");

/**
 * Dashboard counts: videos, meetings, groups, chat unread, saved.
 */
async function getHomeStatsData(req) {
  homeValidator.requireAuthenticatedUser(req);
  const userId = req.user.id;
  const role = req.user.role;

  const vis = getVideoVisibility(req, "v");
  const videoCount = await homeRepo.countVideosWithVisibility(
    vis.whereClause || null,
    [...vis.params]
  );

  let meetings;
  if (role === "Super_Admin") {
    meetings = await homeRepo.countMeetingsSuperAdmin();
  } else if (role === "Administrator") {
    meetings = await homeRepo.countMeetingsAdministrator(userId);
  } else {
    meetings = await homeRepo.countMeetingsMember(userId);
  }

  let groups;
  if (role === "Super_Admin") {
    groups = await homeRepo.countGroupsSuperAdmin();
  } else if (role === "Administrator") {
    groups = await homeRepo.countGroupsAdministrator(userId);
  } else {
    groups = await homeRepo.countGroupsMember(userId);
  }

  const { sql: unreadSql, params: unreadParamsFn } =
    buildUnreadTotalQuery(role);
  const unread = await homeRepo.countUnreadMessages(
    unreadSql,
    unreadParamsFn(userId)
  );

  const saved = await homeRepo.countSavedVideosByMember(userId);

  return {
    video_sessions: videoCount,
    meetings,
    groups,
    group_chat_unread: unread,
    saved_videos: saved,
  };
}

async function getUpcomingMeetings(req) {
  homeValidator.requireAuthenticatedUser(req);
  const userId = req.user.id;
  const role = req.user.role;
  homeValidator.assertHomeMeetingsRole(role);

  const cap = homeValidator.parseUpcomingLimit(req.query.limit);
  const search = homeValidator.parseUpcomingSearch(
    req.query.search ?? req.query.q
  );

  if (role === "Super_Admin") {
    return homeRepo.findUpcomingMeetingsByScope(userId, role, cap, search);
  }
  if (role === "Administrator") {
    return homeRepo.findUpcomingMeetingsByScope(userId, role, cap, search);
  }
  return homeRepo.findUpcomingMeetingsByScope(userId, role, cap, search);
}

async function getMostInterestedVideos(req) {
  homeValidator.requireAuthenticatedUser(req);
  const userId = req.user.id;
  const cap = homeValidator.parseMostInterestedLimit(req.query.limit);
  const search = homeValidator.parseUpcomingSearch(
    req.query.search ?? req.query.q
  );

  const vis = getVideoVisibility(req, "v");
  const conditions = [];
  const params = [userId];
  if (vis.whereClause) {
    conditions.push(vis.whereClause);
    params.push(...vis.params);
  }
  const searchFilter = buildVideoSearchCondition(search, "v");
  if (searchFilter.clause) {
    conditions.push(searchFilter.clause);
    params.push(...searchFilter.params);
  }
  const whereSql = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  params.push(cap);

  const rows = await homeRepo.findMostInterestedVideos(whereSql, params);

  return (rows || []).map((row) => {
    const {
      watch_progress_seconds: _wps,
      watch_completed: _wc,
      watch_status: _ws,
      watch_progress_percentage: pp,
      likes_count: lc,
      comments_count: cc,
      saved_count: sc,
      interest_score: is,
      ...rest
    } = row;
    return {
      ...rest,
      thumbnail_url: rest.poster_url,
      likes_count: Number(lc) || 0,
      comments_count: Number(cc) || 0,
      saved_count: Number(sc) || 0,
      interest_score: Number(is) || 0,
      watch_status: row.watch_status,
      progress_percentage:
        pp == null ? null : Math.min(100, Math.max(0, Number(pp))),
      watch_progress: mapWatchProgressFromRow(row),
    };
  });
}

async function getHomeLeaders(req) {
  homeValidator.requireAuthenticatedUser(req);
  const userId = req.user.id;
  const role = req.user.role;
  const cap = homeValidator.parseLeadersLimit(req.query.limit);
  const search = homeValidator.parseUpcomingSearch(
    req.query.search ?? req.query.q
  );

  const rows = await homeRepo.findHomeLeadersByScope(
    userId,
    role,
    cap,
    search
  );

  return (rows || []).map((r) => ({
    id: r.leader_id,
    name: r.name,
    user_photo: r.user_photo,
    position: { id: r.position_id, title: r.position_title },
  }));
}

async function getHomeSavedVideos(req) {
  homeValidator.requireAuthenticatedUser(req);
  const userId = req.user.id;
  const cap = homeValidator.parseSavedVideosLimit(req.query.limit);
  const search = homeValidator.parseUpcomingSearch(
    req.query.search ?? req.query.q
  );

  const visibility = getVideoVisibility(req, "v");
  const conditions = ["sv.member_id = ?"];
  const params = [userId, userId];

  if (visibility.whereClause) {
    conditions.push(visibility.whereClause);
    params.push(...visibility.params);
  }
  const searchFilter = buildVideoSearchCondition(search, "v");
  if (searchFilter.clause) {
    conditions.push(searchFilter.clause);
    params.push(...searchFilter.params);
  }

  params.push(cap);
  const whereClause = conditions.join(" AND ");
  const rows = await homeRepo.findHomeSavedVideos(whereClause, params);

  return (rows || []).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug ?? null,
    poster_url: r.poster_url,
    thumbnail_url: r.poster_url,
    duration: r.duration,
    group_id: r.group_id,
    group_name: r.group_name,
    saved_at: r.saved_at,
    watch_status: r.watch_status,
    progress_percentage:
      r.watch_progress_percentage == null
        ? null
        : Number(r.watch_progress_percentage),
    watch_progress: mapWatchProgressFromRow(r),
  }));
}

module.exports = {
  getHomeStatsData,
  getUpcomingMeetings,
  getMostInterestedVideos,
  getHomeLeaders,
  getHomeSavedVideos,
  isHomeMeetingsRole: homeValidator.isHomeMeetingsRole,
  UPCOMING_DEFAULT_LIMIT: homeValidator.UPCOMING_DEFAULT_LIMIT,
  UPCOMING_MAX_LIMIT: homeValidator.UPCOMING_MAX_LIMIT,
  MOST_INTERESTED_DEFAULT_LIMIT: homeValidator.MOST_INTERESTED_DEFAULT_LIMIT,
  MOST_INTERESTED_MAX_LIMIT: homeValidator.MOST_INTERESTED_MAX_LIMIT,
  LEADERS_DEFAULT_LIMIT: homeValidator.LEADERS_DEFAULT_LIMIT,
  LEADERS_MAX_LIMIT: homeValidator.LEADERS_MAX_LIMIT,
  SAVED_VIDEOS_DEFAULT_LIMIT: homeValidator.SAVED_VIDEOS_DEFAULT_LIMIT,
  SAVED_VIDEOS_MAX_LIMIT: homeValidator.SAVED_VIDEOS_MAX_LIMIT,
};
