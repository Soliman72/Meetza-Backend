const schedule = require("node-schedule");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { createNotification } = require("./notificationService");

const JOB_NAME_PREFIX = "weekly-meeting-series-";

function jobNameForSeries(seriesId) {
  return `${JOB_NAME_PREFIX}${seriesId}`;
}

function toMysqlDatetime(d) {
  const x = d instanceof Date ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())} ${pad(x.getHours())}:${pad(x.getMinutes())}:${pad(x.getSeconds())}`;
}

function cancelWeeklySeriesJob(seriesId) {
  try {
    schedule.cancelJob(jobNameForSeries(seriesId));
  } catch (e) {
    console.error(`[meeting recurrence] cancel job failed for ${seriesId}:`, e);
  }
}

/**
 * Inserts the next weekly occurrence if the slot is free and the series is active.
 * @param {string} seriesId
 * @param {Date} fireDate - scheduled invocation time from node-schedule
 */
async function spawnWeeklyOccurrence(seriesId, fireDate) {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM meeting_series WHERE id = ? AND is_active = 1", [
      seriesId,
    ]);
  if (rows.length === 0) {
    return;
  }
  const s = rows[0];

  if (!s.template_title) {
    console.warn(
      `[meeting recurrence] Skipped spawn for series ${seriesId}: template_title is missing`,
    );
    return;
  }

  const startMysql = toMysqlDatetime(fireDate);
  const endAt = new Date(fireDate.getTime() + Number(s.duration_ms));
  const endMysql = toMysqlDatetime(endAt);

  const [dup] = await db.promise().query(
    `SELECT id FROM meeting WHERE series_id = ?
     AND TIMESTAMPDIFF(SECOND, start_time, ?) BETWEEN -2 AND 2
     LIMIT 1`,
    [seriesId, startMysql],
  );
  if (dup.length > 0) {
    return;
  }

  const [overlap] = await db.promise().query(
    `SELECT id FROM meeting
    WHERE group_id = ? AND status = 'Scheduled'
    AND start_time < ? AND end_time > ?`,
    [s.group_id, endMysql, startMysql],
  );
  if (overlap.length > 0) {
    console.warn(
      `[meeting recurrence] Skipped spawn for series ${seriesId}: overlapping Scheduled meeting in group`,
    );
    return;
  }

  const meetingId = uuidv4();
  await db.promise().query(
    `INSERT INTO meeting (id, title, start_time, end_time, status, administrator_id, group_id, poster_url, description, recording, is_weekly, series_id)
    VALUES (?, ?, ?, ?, 'Scheduled', ?, ?, ?, ?, ?, 1, ?)`,
    [
      meetingId,
      s.template_title,
      startMysql,
      endMysql,
      s.administrator_id,
      s.group_id,
      s.template_poster_url,
      s.template_description,
      s.template_recording,
      seriesId,
    ],
  );

  try {
    const [members] = await db
      .promise()
      .query("SELECT member_id FROM group_membership WHERE group_id = ?", [
        s.group_id,
      ]);
    const notificationTitle = "New meeting scheduled";
    const notificationMessage = `A new meeting "${s.template_title}" is scheduled from ${startMysql} to ${endMysql}.`;
    await Promise.all(
      members.map((m) =>
        createNotification({
          senderId: s.administrator_id,
          memberId: m.member_id,
          title: notificationTitle,
          message: notificationMessage,
        }),
      ),
    );
  } catch (notifyErr) {
    console.error(
      "[meeting recurrence] Failed to send meeting notifications:",
      notifyErr,
    );
  }
}

function registerWeeklySeriesJob(seriesRow) {
  const seriesId = seriesRow.id;
  cancelWeeklySeriesJob(seriesId);

  // Run exactly 1 minute after the server starts (or after the series is activated)
  const scheduledTime = new Date(Date.now() + 60 * 1000);
  console.log(
    `[meeting recurrence] Test job scheduled to run at: ${scheduledTime.toLocaleString()}`,
  );

  schedule.scheduleJob(
    jobNameForSeries(seriesId),
    scheduledTime,
    (fireDate) => {
      console.log(
        `[meeting recurrence] Cron job firing NOW for series ${seriesId}!`,
      );
      spawnWeeklyOccurrence(seriesId, fireDate).catch((err) => {
        console.error(
          `[meeting recurrence] spawnWeeklyOccurrence failed for ${seriesId}:`,
          err,
        );
      });
    },
  );
}

async function bootstrapMeetingRecurrenceJobs() {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM meeting_series WHERE is_active = 1");
  for (const row of rows) {
    registerWeeklySeriesJob(row);
  }
  console.log(
    `[meeting recurrence] Registered ${rows.length} active weekly series job(s).`,
  );
}

/**
 * Persist series metadata and register the weekly job (call after first meeting INSERT).
 */
async function activateWeeklySeries({
  seriesId,
  groupId,
  administratorId,
  originalMeetingId,
  templateTitle,
  templatePosterUrl,
  templateDescription,
  templateRecording,
  durationMs,
  startDate,
}) {
  const d = startDate instanceof Date ? startDate : new Date(startDate);
  const dayOfWeek = d.getDay();
  const startHour = d.getHours();
  const startMinute = d.getMinutes();
  const startSecond = d.getSeconds();

  await db.promise().query(
    `INSERT INTO meeting_series (
      id, is_active, group_id, administrator_id, original_meeting_id,
      template_title, template_poster_url, template_description, template_recording,
      duration_ms, day_of_week, start_hour, start_minute, start_second
    ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      seriesId,
      groupId,
      administratorId,
      originalMeetingId,
      templateTitle,
      templatePosterUrl,
      templateDescription,
      templateRecording,
      durationMs,
      dayOfWeek,
      startHour,
      startMinute,
      startSecond,
    ],
  );

  const [seriesRows] = await db
    .promise()
    .query("SELECT * FROM meeting_series WHERE id = ?", [seriesId]);
  if (seriesRows[0]) {
    registerWeeklySeriesJob(seriesRows[0]);
  }
}

async function deactivateSeriesInDb(seriesId) {
  await db
    .promise()
    .query("UPDATE meeting_series SET is_active = 0 WHERE id = ?", [seriesId]);

  // also set is_weekly to 0 for all meetings in this series
  await db
    .promise()
    .query("UPDATE meeting SET is_weekly = 0 WHERE series_id = ?", [seriesId]);

  cancelWeeklySeriesJob(seriesId);
}

async function reactivateSeriesInDb(seriesId) {
  await db
    .promise()
    .query("UPDATE meeting_series SET is_active = 1 WHERE id = ?", [seriesId]);

  // also set is_weekly to 1 for all meetings in this series
  await db
    .promise()
    .query("UPDATE meeting SET is_weekly = 1 WHERE series_id = ?", [seriesId]);

  const [seriesRows] = await db
    .promise()
    .query("SELECT * FROM meeting_series WHERE id = ?", [seriesId]);
  if (seriesRows[0]) {
    registerWeeklySeriesJob(seriesRows[0]);
  }
}

module.exports = {
  registerWeeklySeriesJob,
  cancelWeeklySeriesJob,
  bootstrapMeetingRecurrenceJobs,
  activateWeeklySeries,
  deactivateSeriesInDb,
  reactivateSeriesInDb,
};
