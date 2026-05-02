const db = require("../config/db");
const { assertSafeSqlFragment } = require("../utils/sqlSafety");

async function queryRows(sql, params = []) {
  const [rows] = await db.promise().query(sql, params);
  return rows;
}

async function queryExec(sql, params = []) {
  const [result] = await db.promise().query(sql, params);
  return result;
}

exports.findGroupById = async (groupId) => {
  const rows = await queryRows("SELECT * FROM `group` WHERE id = ?", [groupId]);
  return rows[0] || null;
};

exports.findMeetingById = async (id) => {
  const rows = await queryRows("SELECT * FROM meeting WHERE id = ?", [id]);
  return rows[0] || null;
};

/** Alias for validators / legacy imports */
exports.getMeetingById = exports.findMeetingById;

exports.findMeetingSeriesById = async (seriesId) => {
  const rows = await queryRows("SELECT * FROM meeting_series WHERE id = ?", [
    seriesId,
  ]);
  return rows[0] || null;
};

exports.countScheduledOverlap = async (
  groupId,
  startTime,
  endTime,
  excludeMeetingId = null
) => {
  let sql = `SELECT id FROM meeting
    WHERE group_id = ? AND status = 'Scheduled'
    AND start_time < ? AND end_time > ?`;
  const params = [groupId, endTime, startTime];
  if (excludeMeetingId) {
    sql += " AND id <> ?";
    params.push(excludeMeetingId);
  }
  return queryRows(sql, params);
};

exports.insertMeeting = async ({
  id,
  title,
  start_time,
  end_time,
  status,
  group_id,
  poster_url,
  description,
  recording,
  is_weekly,
  series_id,
}) => {
  await queryExec(
    `INSERT INTO meeting (id, title, start_time, end_time, status, group_id, poster_url, description, recording, is_weekly, series_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      title,
      start_time,
      end_time,
      status,
      group_id,
      poster_url,
      description,
      recording,
      is_weekly,
      series_id,
    ]
  );
};

exports.deleteMeetingById = async (id) => {
  await queryExec("DELETE FROM meeting WHERE id = ?", [id]);
};

exports.deleteMeetingsBySeriesId = async (seriesId) => {
  await queryExec("DELETE FROM meeting WHERE series_id = ?", [seriesId]);
};

exports.deleteMeetingSeriesById = async (seriesId) => {
  await queryExec("DELETE FROM meeting_series WHERE id = ?", [seriesId]);
};

exports.updateMeetingById = async (setClause, paramsWithoutId, id) => {
  assertSafeSqlFragment(setClause, "setClause");
  const sql = `UPDATE meeting SET ${setClause} WHERE id = ?`;
  await queryExec(sql, [...paramsWithoutId, id]);
};

exports.updateMeetingSeriesTemplate = async (setClause, params, seriesId) => {
  assertSafeSqlFragment(setClause, "setClause");
  const sql = `UPDATE meeting_series SET ${setClause} WHERE id = ?`;
  await queryExec(sql, [...params, seriesId]);
};

exports.getGroupAdminsWithRoles = async (groupId) => {
  return queryRows(
    "SELECT user_id, role FROM group_admin WHERE group_id = ?",
    [groupId]
  );
};

exports.getGroupOwnerUserId = async (groupId) => {
  const rows = await queryRows(
    "SELECT user_id FROM group_admin WHERE group_id = ? AND role = 'OWNER' LIMIT 1",
    [groupId]
  );
  return rows[0]?.user_id ?? null;
};

exports.getMemberIdsByGroupId = async (groupId) => {
  const rows = await queryRows(
    "SELECT member_id FROM group_membership WHERE group_id = ?",
    [groupId]
  );
  return rows.map((r) => r.member_id);
};

exports.findGroupMembership = async (groupId, userId) => {
  const rows = await queryRows(
    "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
    [groupId, userId]
  );
  return rows[0] || null;
};

exports.findMeetingParticipant = async (meetingId, userId) => {
  const rows = await queryRows(
    "SELECT id FROM meeting_participant WHERE meeting_id = ? AND user_id = ?",
    [meetingId, userId]
  );
  return rows[0] || null;
};

exports.insertMeetingParticipant = async (participantId, meetingId, userId) => {
  await queryExec(
    "INSERT INTO meeting_participant (id, meeting_id, user_id) VALUES (?, ?, ?)",
    [participantId, meetingId, userId]
  );
};

exports.deleteMeetingParticipant = async (meetingId, userId) => {
  const result = await queryExec(
    "DELETE FROM meeting_participant WHERE meeting_id = ? AND user_id = ?",
    [meetingId, userId]
  );
  return result.affectedRows;
};

exports.listMeetingParticipants = async (meetingId) => {
  return queryRows(
    `SELECT mp.id, mp.meeting_id, mp.user_id, mp.joined_at,
            u.name AS member_name, u.email AS member_email, u.user_photo AS member_photo
     FROM meeting_participant mp
     JOIN user u ON u.id = mp.user_id
     WHERE mp.meeting_id = ?
     ORDER BY mp.joined_at ASC`,
    [meetingId]
  );
};

exports.listMeetingsForMember = async (
  userId,
  { group_id, title, dateClause, dateParams }
) => {
  let sql =
    "SELECT * FROM meeting WHERE group_id IN (SELECT group_id FROM group_membership WHERE member_id = ?)";
  const params = [userId];
  if (group_id) {
    sql += " AND group_id = ?";
    params.push(group_id);
  }
  if (title) {
    sql += " AND title LIKE ?";
    params.push(`%${title}%`);
  }
  if (dateClause) {
    assertSafeSqlFragment(dateClause, "dateClause");
    sql += " AND " + dateClause;
    params.push(...dateParams);
  }
  sql += " ORDER BY start_time DESC";
  return queryRows(sql, params);
};

exports.listMeetingsForAdministrator = async (
  userId,
  { title, group_id, dateClause, dateParams }
) => {
  let sql = "SELECT * FROM meeting";
  const conditions = [];
  const params = [];
  conditions.push(
    "EXISTS (SELECT 1 FROM group_admin ga WHERE ga.group_id = meeting.group_id AND ga.user_id = ?)"
  );
  params.push(userId);
  if (title) {
    conditions.push("title LIKE ?");
    params.push(`%${title}%`);
  }
  if (group_id) {
    conditions.push("group_id = ?");
    params.push(group_id);
  }
  if (dateClause) {
    assertSafeSqlFragment(dateClause, "dateClause");
    conditions.push(dateClause);
    params.push(...dateParams);
  }
  sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY start_time DESC";
  return queryRows(sql, params);
};

exports.listMeetingsSuperAdmin = async ({
  title,
  group_id,
  dateClause,
  dateParams,
}) => {
  let sql = "SELECT * FROM meeting";
  const conditions = [];
  const params = [];
  if (title) {
    conditions.push("title LIKE ?");
    params.push(`%${title}%`);
  }
  if (group_id) {
    conditions.push("group_id = ?");
    params.push(group_id);
  }
  if (dateClause) {
    assertSafeSqlFragment(dateClause, "dateClause");
    conditions.push(dateClause);
    params.push(...dateParams);
  }
  if (conditions.length) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY start_time DESC";
  return queryRows(sql, params);
};

exports.setMeetingWeeklyAndSeries = async (meetingId, seriesId) => {
  await queryExec(
    "UPDATE meeting SET is_weekly = 1, series_id = ? WHERE id = ?",
    [seriesId, meetingId]
  );
};

exports.setMeetingWeeklyOnly = async (meetingId) => {
  await queryExec("UPDATE meeting SET is_weekly = 1 WHERE id = ?", [meetingId]);
};

exports.getFirstGroupAdminUserId = async (groupId) => {
  const rows = await queryRows(
    "SELECT user_id FROM group_admin WHERE group_id = ? LIMIT 1",
    [groupId]
  );
  return rows[0]?.user_id ?? null;
};

/**
 * Attach group admins + meeting_admin users to each meeting row (same shape as legacy API).
 */
exports.attachAdminsToMeetings = async (meetings) => {
  if (!Array.isArray(meetings) || meetings.length === 0) return meetings;
  const groupIds = [
    ...new Set(meetings.map((m) => m.group_id).filter(Boolean)),
  ];
  const meetingIds = [...new Set(meetings.map((m) => m.id).filter(Boolean))];

  let adminsByGroup = {};
  if (groupIds.length > 0) {
    const placeholders = groupIds.map(() => "?").join(",");
    const admins = await queryRows(
      `SELECT ga.group_id, ga.user_id AS group_admin_id, ga.role, ga.assigned_by, ga.created_at,
              u.name, u.email, u.user_photo
       FROM group_admin ga
       JOIN user u ON u.id = ga.user_id
       WHERE ga.group_id IN (${placeholders})
       ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC`,
      groupIds
    );
    adminsByGroup = admins.reduce((acc, row) => {
      if (!acc[row.group_id]) acc[row.group_id] = [];
      acc[row.group_id].push(row);
      return acc;
    }, {});
  }

  let meetingAdminByMeetingId = {};
  if (meetingIds.length > 0) {
    const mph = meetingIds.map(() => "?").join(",");
    const maRows = await queryRows(
      `SELECT meeting_id, user_id FROM meeting_admin WHERE meeting_id IN (${mph})`,
      meetingIds
    );
    meetingAdminByMeetingId = (maRows || []).reduce((acc, row) => {
      if (!acc[row.meeting_id]) acc[row.meeting_id] = [];
      acc[row.meeting_id].push(row.user_id);
      return acc;
    }, {});
  }

  return meetings.map((meeting) => {
    const groupAdmins = adminsByGroup[meeting.group_id] || [];
    const maUsers = meetingAdminByMeetingId[meeting.id] || [];
    const seen = new Set(groupAdmins.map((r) => String(r.group_admin_id)));
    const merged = [...groupAdmins];
    for (const uid of maUsers) {
      const s = String(uid);
      if (seen.has(s)) continue;
      seen.add(s);
      merged.push({
        group_admin_id: uid,
        role: "MEETING_ADMIN",
      });
    }
    return {
      ...meeting,
      admins: merged,
    };
  });
};
