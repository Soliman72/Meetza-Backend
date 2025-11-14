const express = require("express");
const router = express.Router();
const videoController = require("../controller/videoController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

// Create video with file upload
router.post(
  "/create",
  verifyToken,
  checkAdminPermission,
  videoController.createVideo
);
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  videoController.getVideoById
);
router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  videoController.getAllVideos
);
router.post(
  "/:id",
  verifyToken,
  checkAdminPermission,
  videoController.updateVideo
);
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  videoController.deleteVideo
);

module.exports = router;
