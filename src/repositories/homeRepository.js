const db = require("../config/db");
const { WATCH_PROGRESS_SELECT } = require("../utils/videoWatchProgressFields");
const { assertSafeSqlFragment } = require("../utils/sqlSafety");

async function queryRows(sql, params = []) {
  const [rows] = await db.promise().query(sql, params);
  return rows;
}

exports.countVideosWithVisibility = async (whereClause, params) => {
  let sql = "SELECT COUNT(*) AS c FROM video v";
  if (whereClause) {
    assertSafeSqlFragment(whereClause, "whereClause");
    sql += ` WHERE ${whereClause}`;
  }
  const rows = await queryRows(sql, params);
  return Number(rows[0]?.c) || 0;
};

exports.countMeetingsSuperAdmin = async () => {
  const rows = await queryRows("SELECT COUNT(*) AS c FROM meeting");
  return Number(rows[0]?.c) || 0;
};

exports.countMeetingsAdministrator = async (userId) => {
  const rows = await queryRows(
    `
    SELECT COUNT(*) AS c FROM meeting m
    WHERE EXISTS (
      SELECT 1 FROM group_admin ga
      WHERE ga.group_id = m.group_id AND ga.user_id = ?
    )
  `,
    [userId]
  );
  return Number(rows[0]?.c) || 0;
};

exports.countMeetingsMember = async (userId) => {
  const rows = await queryRows(
    `
    SELECT COUNT(*) AS c FROM meeting
    WHERE group_id IN (
      SELECT group_id FROM group_membership WHERE member_id = ?
    )
  `,
    [userId]
  );
  return Number(rows[0]?.c) || 0;
};

exports.countGroupsSuperAdmin = async () => {
  const rows = await queryRows("SELECT COUNT(*) AS c FROM `group`");
  return Number(rows[0]?.c) || 0;
};

exports.countGroupsAdministrator = async (userId) => {
  const rows = await queryRows(
    "SELECT COUNT(*) AS c FROM group_admin WHERE user_id = ?",
    [userId]
  );
  return Number(rows[0]?.c) || 0;
};

exports.countGroupsMember = async (userId) => {
  const rows = await queryRows(
    "SELECT COUNT(*) AS c FROM group_membership WHERE member_id = ?",
    [userId]
  );
  return Number(rows[0]?.c) || 0;
};

exports.countUnreadMessages = async (sql, params) => {
  assertSafeSqlFragment(sql, "sql");
  const rows = await queryRows(sql, params);
  return Number(rows[0]?.c) || 0;
};

exports.countSavedVideosByMember = async (userId) => {
  const rows = await queryRows(
    "SELECT COUNT(*) AS c FROM saved_video WHERE member_id = ?",
    [userId]
  );
  return Number(rows[0]?.c) || 0;
};

exports.findUpcomingMeetingsByScope = async (userId, role, limit, search) => {
  const sql = `
    SELECT m.id, m.title, m.start_time, m.end_time, m.status, m.group_id,
           g.group_name
    FROM meeting m
    INNER JOIN \`group\` g ON g.id = m.group_id
    WHERE m.status = 'Scheduled'
      AND m.start_time >= NOW()
      ${
        role === "Administrator"
          ? `AND EXISTS (
        SELECT 1 FROM group_admin ga
        WHERE ga.group_id = m.group_id AND ga.user_id = ?
      )`
          : ""
      }
      ${
        role === "Member"
          ? `AND m.group_id IN (
        SELECT group_id FROM group_membership WHERE member_id = ?
      )`
          : ""
      }
      ${search ? "AND (m.title LIKE ? OR g.group_name LIKE ?)" : ""}
    ORDER BY m.start_time ASC
    LIMIT ?
  `;
  const params = [];
  if (role === "Administrator" || role === "Member") {
    params.push(userId);
  }
  if (search) params.push(`%${search}%`, `%${search}%`);
  params.push(limit);
  return queryRows(sql, params);
};




exports.findMostInterestedVideos = async (whereSql, params) => {
  assertSafeSqlFragment(whereSql, "whereSql");
  const sql = `
    SELECT
      v.id,
      v.title,
      v.slug,
      v.poster_url,
      v.video_url,
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
      ${WATCH_PROGRESS_SELECT}
    FROM video v
    LEFT JOIN \`group\` g ON g.id = v.group_id
    LEFT JOIN video_watch_progress vwp
      ON vwp.video_id = v.id AND vwp.user_id = ?
    ${whereSql}
    ORDER BY interest_score DESC, v.updated_at DESC
    LIMIT ?
  `;
  return queryRows(sql, params);
};

exports.findHomeLeadersByScope = async (
  userId,
  role,
  limit,
  search = ""
) => {
  const sql = `
      SELECT DISTINCT
        u.id AS leader_id,
        u.name,
        u.user_photo,
        p.id AS position_id,
        p.title AS position_title
      ${
        role === "Super_Admin"
          ? "FROM administrator a INNER JOIN user u ON u.id = a.user_id AND u.role = 'Administrator' LEFT JOIN position p ON p.administrator_id = a.user_id"
          : "FROM group_admin ga INNER JOIN user u ON u.id = ga.user_id AND u.role = 'Administrator' LEFT JOIN position p ON p.administrator_id = ga.user_id"
      }
      WHERE 1 = 1
      ${
        role === "Administrator"
          ? `AND ga.group_id IN (
        SELECT group_id FROM group_admin WHERE user_id = ?
      )
        AND ga.role IN ('OWNER', 'ADMIN')
        AND ga.user_id <> ?`
          : ""
      }
      ${
        role === "Member"
          ? `AND ga.group_id IN (
        SELECT group_id FROM group_membership WHERE member_id = ?
      )
        AND ga.role IN ('OWNER', 'ADMIN')`
          : ""
      }
      ${search ? "AND (u.name LIKE ? OR p.title LIKE ?)" : ""}
      ORDER BY u.name ASC
      LIMIT ?
    `;
  const params = [];
  if (role === "Administrator") {
    params.push(userId, userId);
  } else if (role === "Member") {
    params.push(userId);
  }
  if (search) {
    params.push(`%${search}%`, `%${search}%`);
  }
  params.push(limit);
  return queryRows(sql, params);
};

exports.findHomeSavedVideos = async (whereClause, params) => {
  assertSafeSqlFragment(whereClause, "whereClause");
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
      ${WATCH_PROGRESS_SELECT}
    FROM saved_video sv
    INNER JOIN video v ON v.id = sv.video_id
    LEFT JOIN \`group\` g ON g.id = v.group_id
    LEFT JOIN video_watch_progress vwp
      ON vwp.video_id = v.id AND vwp.user_id = ?
    WHERE ${whereClause}
    ORDER BY sv.timestamp DESC
    LIMIT ?
  `;
  return queryRows(sql, params);
};
