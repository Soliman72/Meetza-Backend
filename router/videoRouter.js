const express = require("express");
const router = express.Router();
const videoController = require("../controller/videoController");
const videoWatchProgressRouter = require("./videoWatchProgressRouter");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

// Create video with file upload
router.post(
  "/create",
  verifyToken,
  checkAdminPermission,
  videoController.createVideo,
);

// Watch progress CRUD (mounted before `/:id`)
router.use(videoWatchProgressRouter);

router.get("/:id/related", verifyToken, videoController.getRelatedVideos);
router.get("/:id", verifyToken, videoController.getVideoById);
router.get("/", verifyToken, videoController.getAllVideos);
router.post(
  "/:id",
  verifyToken,
  checkAdminPermission,
  videoController.updateVideo,
);
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  videoController.deleteVideo,
);

router.post(
  "/summarize_video/:video_id",
  verifyToken,
  videoController.summarizeVideo,
);

module.exports = router;
