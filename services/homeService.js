const db = require("../config/db");
const { getVideoVisibility } = require("../utils/videoVisibility");
const { buildUnreadTotalQuery } = require("./chatMessageService");

const UPCOMING_DEFAULT_LIMIT = 5;
const UPCOMING_MAX_LIMIT = 50;

const MOST_INTERESTED_DEFAULT_LIMIT = 10;
const MOST_INTERESTED_MAX_LIMIT = 30;

const LEADERS_DEFAULT_LIMIT = 10;
const LEADERS_MAX_LIMIT = 30;

const SAVED_VIDEOS_DEFAULT_LIMIT = 10;
const SAVED_VIDEOS_MAX_LIMIT = 30;

/**
 * Dashboard counts: videos, meetings, groups, chat unread, saved.
 */
async function getHomeStatsData(req) {
  const userId = req.user.id;
  const role = req.user.role;

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
    groupsSql = "SELECT COUNT(*) AS c FROM group_admin WHERE user_id = ?";
    groupsParams.push(userId);
  } else {
    groupsSql =
      "SELECT COUNT(*) AS c FROM group_membership WHERE member_id = ?";
    groupsParams.push(userId);
  }

  const { sql: unreadSql, params: unreadParamsFn } = buildUnreadTotalQuery(role);
  const unreadParams = unreadParamsFn(userId);

  const savedSql = "SELECT COUNT(*) AS c FROM saved_video WHERE member_id = ?";
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

  return {
    video_sessions: Number(videoRows[0]?.c) || 0,
    meetings: Number(meetingRows[0]?.c) || 0,
    groups: Number(groupsRows[0]?.c) || 0,
    group_chat_unread: Number(unreadRows[0]?.c) || 0,
    saved_videos: Number(savedRows[0]?.c) || 0,
  };
}

/**
 * Scheduled meetings that have not started yet, soonest first.
 * Visibility: Super_Admin — all; Administrator — groups they admin; Member — member groups.
 */
async function getUpcomingMeetings({ userId, role, limit }) {
  const n = Number(limit);
  const cap = Number.isFinite(n)
    ? Math.min(Math.max(Math.trunc(n), 1), UPCOMING_MAX_LIMIT)
    : UPCOMING_DEFAULT_LIMIT;

  const baseFrom = `
    FROM meeting m
    INNER JOIN \`group\` g ON g.id = m.group_id
    WHERE m.status = 'Scheduled'
      AND m.start_time >= NOW()
  `;

  const select = `
    SELECT m.id, m.title, m.start_time, m.end_time, m.status, m.group_id,
           g.group_name
  `;

  if (role === "Super_Admin") {
    const sql =
      select + baseFrom + ` ORDER BY m.start_time ASC LIMIT ?`;
    const [rows] = await db.promise().query(sql, [cap]);
    return rows;
  }

  if (role === "Administrator") {
    const sql =
      select +
      baseFrom +
      `
      AND EXISTS (
        SELECT 1 FROM group_admin ga
        WHERE ga.group_id = m.group_id AND ga.user_id = ?
      )
      ORDER BY m.start_time ASC
      LIMIT ?
    `;
    const [rows] = await db.promise().query(sql, [userId, cap]);
    return rows;
  }

  if (role === "Member") {
    const sql =
      select +
      baseFrom +
      `
      AND m.group_id IN (
        SELECT group_id FROM group_membership WHERE member_id = ?
      )
      ORDER BY m.start_time ASC
      LIMIT ?
    `;
    const [rows] = await db.promise().query(sql, [userId, cap]);
    return rows;
  }

  return [];
}

function isHomeMeetingsRole(role) {
  return (
    role === "Super_Admin" ||
    role === "Administrator" ||
    role === "Member"
  );
}

/**
 * Videos the user can see, ranked by engagement (likes + comments + saves).
 * Watch state comes from `video_watch_progress` when present (run migration if missing).
 */
async function getMostInterestedVideos(req, limit) {
  const userId = req.user.id;
  const n = Number(limit);
  const cap = Number.isFinite(n)
    ? Math.min(Math.max(Math.trunc(n), 1), MOST_INTERESTED_MAX_LIMIT)
    : MOST_INTERESTED_DEFAULT_LIMIT;

  const vis = getVideoVisibility(req, "v");
  const conditions = [];
  const params = [userId];
  if (vis.whereClause) {
    conditions.push(vis.whereClause);
    params.push(...vis.params);
  }
  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      v.id,
      v.title,
      v.slug,
      v.poster_url,
      v.duration,
      v.group_id,
      g.group_name,
      (SELECT COUNT(*) FROM \`like\` l WHERE l.video_id = v.id AND l.like_type = 1) AS likes_count,
      (SELECT COUNT(*) FROM comment c WHERE c.video_id = v.id) AS comments_count,
      (SELECT COUNT(*) FROM saved_video sv WHERE sv.video_id = v.id) AS saved_count,
      (
        (SELECT COUNT(*) FROM \`like\` l2 WHERE l2.video_id = v.id AND l2.like_type = 1) +
        (SELECT COUNT(*) FROM comment c2 WHERE c2.video_id = v.id) +
        (SELECT COUNT(*) FROM saved_video sv2 WHERE sv2.video_id = v.id)
      ) AS interest_score,
      vwp.progress_seconds,
      vwp.completed,
      CASE
        WHEN vwp.completed = 1 THEN 'completed'
        WHEN COALESCE(vwp.progress_seconds, 0) > 0 THEN 'watching'
        ELSE NULL
      END AS watch_status,
      CASE
        WHEN vwp.completed = 1 THEN 100
        WHEN TIME_TO_SEC(v.duration) > 0 AND COALESCE(vwp.progress_seconds, 0) > 0
          THEN LEAST(100, ROUND(100 * vwp.progress_seconds / TIME_TO_SEC(v.duration)))
        ELSE NULL
      END AS progress_percentage
    FROM video v
    LEFT JOIN \`group\` g ON g.id = v.group_id
    LEFT JOIN video_watch_progress vwp
      ON vwp.video_id = v.id AND vwp.user_id = ?
    ${whereSql}
    ORDER BY interest_score DESC, v.updated_at DESC
    LIMIT ?
  `;

  params.push(cap);
  const [rows] = await db.promise().query(sql, params);

  return (rows || []).map((row) => {
    const {
      progress_seconds: _ps,
      completed: _c,
      likes_count: lc,
      comments_count: cc,
      saved_count: sc,
      interest_score: is,
      progress_percentage: pp,
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
    };
  });
}

/**
 * Leaders (name, photo, position) for home "People" section.
 * Source of truth: groups -> position -> administrator user.
 * Super_Admin: leaders for all groups. Administrator: leaders for groups they admin. Member: leaders for groups they belong to.
 */
async function getHomeLeaders(req, limit) {
  const userId = req.user.id;
  const role = req.user.role;

  const n = Number(limit);
  const cap = Number.isFinite(n)
    ? Math.min(Math.max(Math.trunc(n), 1), LEADERS_MAX_LIMIT)
    : LEADERS_DEFAULT_LIMIT;

  let accessWhere = "";
  const params = [];

  if (role === "Super_Admin") {
    // no filter
  } else if (role === "Administrator") {
    accessWhere = `
      WHERE EXISTS (
        SELECT 1 FROM group_admin ga
        WHERE ga.group_id = g.id AND ga.user_id = ?
      )
    `;
    params.push(userId);
  } else {
    // Member (default)
    accessWhere = `
      WHERE EXISTS (
        SELECT 1 FROM group_membership gm
        WHERE gm.group_id = g.id AND gm.member_id = ?
      )
    `;
    params.push(userId);
  }

  const sql = `
    SELECT DISTINCT
      u.id AS leader_id,
      u.name,
      u.user_photo,
      p.id AS position_id,
      p.title AS position_title
    FROM \`group\` g\
    INNER JOIN group_admin ga ON ga.group_id = g.id
    INNER JOIN user u ON u.id = ga.user_id
    INNER JOIN position p ON p.administrator_id = ga.user_id
    ${accessWhere}
    ORDER BY u.name ASC
    LIMIT ?
  `;
  params.push(cap);
  const [rows] = await db.promise().query(sql, params);
  return (rows || []).map((r) => ({
    id: r.leader_id,
    name: r.name,
    user_photo: r.user_photo,
    position: { id: r.position_id, title: r.position_title },
  }));
}

/**
 * Saved videos for home section (with watching/completed state + progress bar).
 */
async function getHomeSavedVideos(req, limit) {
  const userId = req.user.id;
  const n = Number(limit);
  const cap = Number.isFinite(n)
    ? Math.min(Math.max(Math.trunc(n), 1), SAVED_VIDEOS_MAX_LIMIT)
    : SAVED_VIDEOS_DEFAULT_LIMIT;

  const visibility = getVideoVisibility(req, "v");
  const conditions = ["sv.member_id = ?"];
  const params = [userId, userId]; // first for vwp join, second for sv filter

  if (visibility.whereClause) {
    conditions.push(visibility.whereClause);
    params.push(...visibility.params);
  }

  const sql = `
    SELECT
      v.id,
      v.title,
      v.slug,
      v.poster_url,
      v.duration,
      v.group_id,
      g.group_name,
      sv.timestamp AS saved_at,
      vwp.progress_seconds,
      vwp.completed,
      CASE
        WHEN vwp.completed = 1 THEN 'completed'
        WHEN COALESCE(vwp.progress_seconds, 0) > 0 THEN 'watching'
        ELSE NULL
      END AS watch_status,
      CASE
        WHEN vwp.completed = 1 THEN 100
        WHEN TIME_TO_SEC(v.duration) > 0 AND COALESCE(vwp.progress_seconds, 0) > 0
          THEN LEAST(100, ROUND(100 * vwp.progress_seconds / TIME_TO_SEC(v.duration)))
        ELSE NULL
      END AS progress_percentage
    FROM saved_video sv
    INNER JOIN video v ON v.id = sv.video_id
    LEFT JOIN \`group\` g ON g.id = v.group_id
    LEFT JOIN video_watch_progress vwp
      ON vwp.video_id = v.id AND vwp.user_id = ?
    WHERE ${conditions.join(" AND ")}
    ORDER BY sv.timestamp DESC
    LIMIT ?
  `;

  params.push(cap);
  const [rows] = await db.promise().query(sql, params);
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
      r.progress_percentage == null ? null : Number(r.progress_percentage),
  }));
}

module.exports = {
  getHomeStatsData,
  getUpcomingMeetings,
  getMostInterestedVideos,
  getHomeLeaders,
  getHomeSavedVideos,
  isHomeMeetingsRole,
  UPCOMING_DEFAULT_LIMIT,
  UPCOMING_MAX_LIMIT,
  MOST_INTERESTED_DEFAULT_LIMIT,
  MOST_INTERESTED_MAX_LIMIT,
  LEADERS_DEFAULT_LIMIT,
  LEADERS_MAX_LIMIT,
  SAVED_VIDEOS_DEFAULT_LIMIT,
  SAVED_VIDEOS_MAX_LIMIT,
};
