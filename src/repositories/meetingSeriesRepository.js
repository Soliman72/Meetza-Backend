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

exports.findMeetingSeriesById = async (seriesId) => {
  const rows = await queryRows("SELECT * FROM meeting_series WHERE id = ?", [
    seriesId,
  ]);
  return rows[0] || null;
};

exports.deleteMeetingSeriesById = async (seriesId) => {
  await queryExec("DELETE FROM meeting_series WHERE id = ?", [seriesId]);
};

exports.updateMeetingSeriesTemplate = async (setClause, params, seriesId) => {
  assertSafeSqlFragment(setClause, "setClause");
  const sql = `UPDATE meeting_series SET ${setClause} WHERE id = ?`;
  await queryExec(sql, [...params, seriesId]);
};
