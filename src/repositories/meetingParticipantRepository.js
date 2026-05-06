const db = require("../config/db");

async function queryRows(sql, params = []) {
  const [rows] = await db.promise().query(sql, params);
  return rows;
}

async function queryExec(sql, params = []) {
  const [result] = await db.promise().query(sql, params);
  return result;
}

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
