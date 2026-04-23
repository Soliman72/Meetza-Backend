const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");
const videoWatchProgressRouter = require("./videoWatchProgressRoute");
const { verifyToken } = require("../middleware/verifyToken");
const { checkAdminPermission } = require("../middleware/checkAdminPermission");
const uploadMiddleware = require("../middleware/uploadMiddleware");

router.use(videoWatchProgressRouter);

router.post("/create", verifyToken, checkAdminPermission, uploadMiddleware,  videoController.createVideo);
router.get("/:id/related", verifyToken, videoController.getRelatedVideos);
router.get("/:id", verifyToken, videoController.getVideoById);
router.get("/", verifyToken, videoController.getAllVideos);
router.post("/:id", verifyToken, checkAdminPermission, uploadMiddleware, videoController.updateVideo);
router.delete("/:id", verifyToken, checkAdminPermission, videoController.deleteVideo);
router.post("/summarize_video/:video_id", verifyToken, videoController.summarizeVideo);

module.exports = router;