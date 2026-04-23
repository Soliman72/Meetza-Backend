const express = require("express");
const router = express.Router();
const saved_videoController = require("../controllers/saved_videoController");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/", verifyToken, saved_videoController.createSavedVideo);
router.get("/user", verifyToken, saved_videoController.getSavedVideosByUserId);
router.get("/:video_id", verifyToken, saved_videoController.getSavedVideoById);
router.get("/", verifyToken, saved_videoController.getAllSavedVideos);
router.delete("/:video_id", verifyToken, saved_videoController.deleteSavedVideo);

module.exports = router;