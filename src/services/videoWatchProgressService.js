const repo = require("../repositories/videoWatchProgressRepository");
const videoRepo = require("../repositories/videoRepository");
const { getVideoVisibility } = require("../utils/videoVisibility");
const videoWatchProgressValidator = require("../validators/videoWatchProgressValidator");

function buildProgressPayload(row) {
  if (!row) return null;

  const duration = Number(row.duration_seconds);
  const progress = Number(row.progress_seconds) || 0;
  const completed = row.completed === 1;

  return {
    video_id: row.video_id,
    progress_seconds: progress,
    completed,
    updated_at: row.updated_at,
    watch_status: completed ? "completed" : progress > 0 ? "watching" : null,
    progress_percentage:
      completed
        ? 100
        : duration > 0
        ? Math.min(100, Math.round((progress / duration) * 100))
        : null,
  };
}

async function isVideoAccessibleToRequester(req, videoId) {
  return repo.checkAccess(videoId, getVideoVisibility(req, "v"));
}

async function getByUserAndVideo(userId, videoId) {
  return repo.findOne(userId, videoId);
}

async function listByUser(req, { limit = 30, offset = 0 }) {
  const rows = await repo.findByUser(
    req.user.id,
    Number(limit),
    Number(offset),
    getVideoVisibility(req, "v")
  );

  return rows.map((r) => ({
    ...buildProgressPayload(r),
    title: r.title,
    slug: r.slug,
    poster_url: r.poster_url,
  }));
}

async function resolveVideoIdFromParam(idOrSlug) {
  return videoRepo.resolveVideoId(idOrSlug);
}

/**
 * GET one video progress: resolve slug/id, access, then row for user.
 */
async function getWatchProgressForRequest(req, idParam) {
  const userId = req.user?.id;
  videoWatchProgressValidator.requireUserId(userId);

  const resolvedVideoId = await resolveVideoIdFromParam(idParam);
  if (!resolvedVideoId) {
    const e = new Error("Video not found");
    e.status = 404;
    throw e;
  }
  const allowed = await isVideoAccessibleToRequester(req, resolvedVideoId);
  if (!allowed) {
    const e = new Error("Video not found");
    e.status = 404;
    throw e;
  }
  const row = await getByUserAndVideo(userId, resolvedVideoId);
  return row ? buildProgressPayload(row) : null;
}

/**
 * PUT upsert: validates body, resolves id, upserts.
 */
async function upsertWatchProgressForRequest(req, idParam) {
  const userId = req.user?.id;
  videoWatchProgressValidator.requireUserId(userId);

  const resolvedVideoId = await resolveVideoIdFromParam(idParam);
  if (!resolvedVideoId) {
    const e = new Error("Video not found");
    e.status = 404;
    throw e;
  }
  const allowed = await isVideoAccessibleToRequester(req, resolvedVideoId);
  if (!allowed) {
    const e = new Error("Video not found");
    e.status = 404;
    throw e;
  }

  const { progress_seconds, completed } =
    videoWatchProgressValidator.parseUpsertBody(req.body);

  const existing = await getByUserAndVideo(userId, resolvedVideoId);

  let nextProgress =
    existing != null ? Number(existing.progress_seconds) || 0 : 0;
  if (progress_seconds !== undefined) {
    nextProgress = progress_seconds;
  }

  let nextCompleted =
    existing != null
      ? existing.completed === 1 || existing.completed === true
      : false;
  if (completed !== undefined) {
    nextCompleted = completed;
  }

  const row = await repo.upsert(
    userId,
    resolvedVideoId,
    nextProgress,
    nextCompleted
  );
  return buildProgressPayload(row);
}

async function deleteWatchProgressForRequest(req, idParam) {
  const userId = req.user?.id;
  videoWatchProgressValidator.requireUserId(userId);

  const resolvedVideoId = await resolveVideoIdFromParam(idParam);
  if (!resolvedVideoId) {
    const e = new Error("Video not found");
    e.status = 404;
    throw e;
  }
  const allowed = await isVideoAccessibleToRequester(req, resolvedVideoId);
  if (!allowed) {
    const e = new Error("Video not found");
    e.status = 404;
    throw e;
  }
  const deleted = await repo.remove(userId, resolvedVideoId);
  if (!deleted) {
    const e = new Error("No watch progress record for this video");
    e.status = 404;
    throw e;
  }
  return true;
}

module.exports = {
  buildProgressPayload,
  isVideoAccessibleToRequester,
  getByUserAndVideo,
  listByUser,
  resolveVideoIdFromParam,
  getWatchProgressForRequest,
  upsertWatchProgressForRequest,
  deleteWatchProgressForRequest,
};
