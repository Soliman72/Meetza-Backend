const express = require("express");
const router = express.Router();
const videoController = require("../controller/videoController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdmin } = require("../utils/checkAdmin");

// Create video with file upload
router.post("/create", verifyToken, checkAdmin, videoController.createVideo);
router.get("/:id", verifyToken, videoController.getVideoById);
router.get("/", verifyToken, videoController.getAllVideos);
router.post("/:id", verifyToken, checkAdmin, videoController.updateVideo);
router.delete("/:id", verifyToken, checkAdmin, videoController.deleteVideo);

module.exports = router;
