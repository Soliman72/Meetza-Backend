/**
 * Weekly / recurrence flag from multipart or JSON body.
 */
function parseWeeklyFlag(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return false;
  }
  const s = String(raw).toLowerCase();
  return s === "true" || s === "1";
}

/**
 * Build date filter clause and params for meeting listings.
 * Priority: start_date+end_date > day > week > month.
 */
function getDateFilterForMeetings(query) {
  const { start_date, end_date, day, week, month } = query;
  const hasRange =
    start_date != null &&
    start_date !== "" &&
    end_date != null &&
    end_date !== "";
  if (hasRange) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        error: "start_date and end_date must be valid dates (YYYY-MM-DD)",
      };
    }
    if (start > end) {
      return { error: "start_date must be before or equal to end_date" };
    }
    return {
      clause: "DATE(start_time) >= ? AND DATE(start_time) <= ?",
      params: [start_date, end_date],
    };
  }
  if (day != null && day !== "") {
    const d = new Date(day);
    if (Number.isNaN(d.getTime())) {
      return { error: "day must be a valid date (YYYY-MM-DD)" };
    }
    const dayStr = d.toISOString().slice(0, 10);
    return { clause: "DATE(start_time) = ?", params: [dayStr] };
  }
  if (week != null && week !== "") {
    const w = new Date(week);
    if (Number.isNaN(w.getTime())) {
      return { error: "week must be a valid date (YYYY-MM-DD)" };
    }
    const weekStr = w.toISOString().slice(0, 10);
    return {
      clause: "YEARWEEK(start_time, 1) = YEARWEEK(?, 1)",
      params: [weekStr],
    };
  }
  if (month != null && month !== "") {
    const match = String(month).match(/^(\d{4})-(\d{1,2})$/);
    if (!match) {
      return { error: "month must be YYYY-MM (e.g. 2025-03)" };
    }
    const [, y, m] = match;
    const monthNum = parseInt(m, 10);
    if (monthNum < 1 || monthNum > 12) {
      return { error: "month must be between 01 and 12" };
    }
    return {
      clause: "YEAR(start_time) = ? AND MONTH(start_time) = ?",
      params: [y, monthNum],
    };
  }
  return null;
}

module.exports = {
  parseWeeklyFlag,
  getDateFilterForMeetings,
};
