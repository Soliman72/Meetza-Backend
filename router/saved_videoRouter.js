const express = require("express");
const router = express.Router();
const saved_videoController = require("../controller/saved_videoController");
const { verifyToken } = require("../utils/verifyToken");

// Create a saved video
router.post("/", verifyToken, saved_videoController.createSavedVideo);
// Get all saved videos for a member
router.get("/member", verifyToken, saved_videoController.getSavedVideosByMemberId);
// Get a saved video by id
router.get("/:video_id", verifyToken, saved_videoController.getSavedVideoById);
// Get all saved videos
router.get("/", verifyToken, saved_videoController.getAllSavedVideos);
// Delete a saved video
router.delete("/:video_id", verifyToken, saved_videoController.deleteSavedVideo);

module.exports = router;