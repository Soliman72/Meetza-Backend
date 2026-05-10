const { parseWeeklyFlag } = require("../utils/meetingQueryFilter");

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

exports.assertAuthenticatedUserId = (userId) => {
  if (!userId) {
    throw httpError(401, "Unauthorized: user id is required");
  }
};

exports.validateCreateMeeting = ({
  title,
  start_time,
  end_time,
  group_id,
  recording,
  weekly,
  posterFiles,
  bodyPoster,
}) => {
  if (!posterFiles && !bodyPoster) {
    throw httpError(400, "Poster file is required");
  }
  if (!title || !start_time || !end_time || !group_id || !recording) {
    throw httpError(
      400,
      "Title, start_time, end_time, group_id, and recording are required"
    );
  }
  if (recording !== "1" && recording !== "0") {
    throw httpError(400, "Recording must be 1 or 0");
  }
  const isWeekly = parseWeeklyFlag(weekly);
  if (isWeekly) {
    throw httpError(
      400,
      "Weekly meetings must be created with status Scheduled"
    );
  }

  const start = new Date(start_time);
  const end = new Date(end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw httpError(400, "start_time and end_time must be valid dates");
  }
  const now = new Date();
  if (start < now || end < now) {
    throw httpError(400, "start_time and end_time must not be in the past");
  }
  if (start >= end) {
    throw httpError(400, "end_time must be after start_time");
  }
  return { isWeekly };
};

exports.validateRecordingIfPresent = (recording) => {
  if (recording == null || recording === "") return;
  if (recording !== "1" && recording !== "0") {
    throw httpError(400, "Recording must be 1 or 0");
  }
};

exports.validateMeetingIdParam = (id) => {
  if (!id || String(id).trim() === "") {
    throw httpError(400, "Meeting id is required");
  }
};

exports.validateStatusValue = (status) => {
  if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
    throw httpError(
      400,
      "Status must be one of: Scheduled, Completed, Cancelled"
    );
  }
};

exports.validateDateRange = (start_time, end_time, meetingFallback) => {
  const newStart = start_time != null ? new Date(start_time) : new Date(meetingFallback.start_time);
  const newEnd = end_time != null ? new Date(end_time) : new Date(meetingFallback.end_time);
  if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
    throw httpError(400, "start_time and end_time must be valid dates");
  }
  if (newStart >= newEnd) {
    throw httpError(400, "end_time must be after start_time");
  }
  return { newStart, newEnd };
};
