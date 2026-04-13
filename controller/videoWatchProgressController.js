const db = require("../config/db");
const { resolveVideoId } = require("../utils/resolveVideoId");
const videoWatchProgressService = require("../services/videoWatchProgressService");

/** GET /api/video/watch-progress — list current user's progress (videos they can still see). */
exports.listMyWatchProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    const data = await videoWatchProgressService.listByUser(req, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

/** GET /api/video/:id/watch-progress — one video (id or slug). */
exports.getWatchProgressByVideoId = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    const { id } = req.params;
    const resolvedVideoId = await resolveVideoId(db, id);
    if (!resolvedVideoId) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    const allowed = await videoWatchProgressService.isVideoAccessibleToRequester(
      req,
      resolvedVideoId,
    );
    if (!allowed) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    const row = await videoWatchProgressService.getByUserAndVideo(
      userId,
      resolvedVideoId,
    );
    const data = row ? videoWatchProgressService.buildProgressPayload(row) : null;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

/**
 * PUT /api/video/:id/watch-progress
 * Body: { "progress_seconds": number, "completed": boolean }
 */
exports.upsertWatchProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    const { id } = req.params;
    const resolvedVideoId = await resolveVideoId(db, id);
    if (!resolvedVideoId) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    const allowed = await videoWatchProgressService.isVideoAccessibleToRequester(
      req,
      resolvedVideoId,
    );
    if (!allowed) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const { progress_seconds: psRaw, completed: compRaw } = req.body || {};
    if (psRaw === undefined && compRaw === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide progress_seconds and/or completed",
      });
    }

    const existing = await videoWatchProgressService.getByUserAndVideo(
      userId,
      resolvedVideoId,
    );

    let progress_seconds =
      existing != null ? Number(existing.progress_seconds) || 0 : 0;
    if (psRaw !== undefined && psRaw !== null) {
      progress_seconds = Math.trunc(Number(psRaw));
      if (!Number.isFinite(progress_seconds) || progress_seconds < 0) {
        return res.status(400).json({
          success: false,
          message: "progress_seconds must be a non-negative integer",
        });
      }
    }

    let completed =
      existing != null
        ? existing.completed === 1 || existing.completed === true
        : false;
    if (compRaw !== undefined) {
      completed = Boolean(compRaw);
    }

    const row = await videoWatchProgressService.upsert(userId, resolvedVideoId, {
      progress_seconds,
      completed,
    });
    const data = videoWatchProgressService.buildProgressPayload(row);
    return res.status(200).json({
      success: true,
      message: "Watch progress saved",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

/** DELETE /api/video/:id/watch-progress */
exports.deleteWatchProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }
    const { id } = req.params;
    const resolvedVideoId = await resolveVideoId(db, id);
    if (!resolvedVideoId) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    const allowed = await videoWatchProgressService.isVideoAccessibleToRequester(
      req,
      resolvedVideoId,
    );
    if (!allowed) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    const deleted = await videoWatchProgressService.remove(userId, resolvedVideoId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "No watch progress record for this video",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Watch progress removed",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

