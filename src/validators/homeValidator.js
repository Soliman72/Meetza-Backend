const UPCOMING_DEFAULT_LIMIT = 5;
const UPCOMING_MAX_LIMIT = 50;
const MOST_INTERESTED_DEFAULT_LIMIT = 10;
const MOST_INTERESTED_MAX_LIMIT = 30;
const LEADERS_DEFAULT_LIMIT = 10;
const LEADERS_MAX_LIMIT = 30;
const SAVED_VIDEOS_DEFAULT_LIMIT = 10;
const SAVED_VIDEOS_MAX_LIMIT = 30;

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

exports.requireAuthenticatedUser = (req) => {
  if (!req.user?.id) {
    throw httpError(401, "Unauthorized: user not found");
  }
};

exports.isHomeMeetingsRole = (role) =>
  role === "Super_Admin" ||
  role === "Administrator" ||
  role === "Member";

exports.assertHomeMeetingsRole = (role) => {
  if (!exports.isHomeMeetingsRole(role)) {
    throw httpError(403, "Access denied");
  }
};

function clampLimit(raw, defaultLimit, maxLimit) {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return defaultLimit;
  }
  return Math.min(Math.max(Math.trunc(n), 1), maxLimit);
}

exports.parseUpcomingLimit = (limit) =>
  clampLimit(limit, UPCOMING_DEFAULT_LIMIT, UPCOMING_MAX_LIMIT);

exports.parseMostInterestedLimit = (limit) =>
  clampLimit(limit, MOST_INTERESTED_DEFAULT_LIMIT, MOST_INTERESTED_MAX_LIMIT);

exports.parseLeadersLimit = (limit) =>
  clampLimit(limit, LEADERS_DEFAULT_LIMIT, LEADERS_MAX_LIMIT);

exports.parseSavedVideosLimit = (limit) =>
  clampLimit(limit, SAVED_VIDEOS_DEFAULT_LIMIT, SAVED_VIDEOS_MAX_LIMIT);

exports.UPCOMING_DEFAULT_LIMIT = UPCOMING_DEFAULT_LIMIT;
exports.UPCOMING_MAX_LIMIT = UPCOMING_MAX_LIMIT;
exports.MOST_INTERESTED_DEFAULT_LIMIT = MOST_INTERESTED_DEFAULT_LIMIT;
exports.MOST_INTERESTED_MAX_LIMIT = MOST_INTERESTED_MAX_LIMIT;
exports.LEADERS_DEFAULT_LIMIT = LEADERS_DEFAULT_LIMIT;
exports.LEADERS_MAX_LIMIT = LEADERS_MAX_LIMIT;
exports.SAVED_VIDEOS_DEFAULT_LIMIT = SAVED_VIDEOS_DEFAULT_LIMIT;
exports.SAVED_VIDEOS_MAX_LIMIT = SAVED_VIDEOS_MAX_LIMIT;
