const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const videoWatchProgressController = require("../controllers/videoWatchProgressController");

/** Mounted under /api/video — list before /:id routes in parent router. */
router.get("/watch-progress", verifyToken, videoWatchProgressController.listMyWatchProgress);
router.get(
  "/:id/watch-progress",
  verifyToken,
  videoWatchProgressController.getWatchProgressByVideoId
);
router.put(
  "/:id/watch-progress",
  verifyToken,
  videoWatchProgressController.upsertWatchProgress
);
router.delete(
  "/:id/watch-progress",
  verifyToken,
  videoWatchProgressController.deleteWatchProgress
);

module.exports = router;
