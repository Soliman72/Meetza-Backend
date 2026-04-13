const express = require("express");
const router = express.Router();
const { verifyToken } = require("../utils/verifyToken");
const ctrl = require("../controller/videoWatchProgressController");

// Must be mounted before any `/:id` routes
router.get("/watch-progress", verifyToken, ctrl.listMyWatchProgress);
router.get("/:id/watch-progress", verifyToken, ctrl.getWatchProgressByVideoId);
router.put("/:id/watch-progress", verifyToken, ctrl.upsertWatchProgress);
router.delete("/:id/watch-progress", verifyToken, ctrl.deleteWatchProgress);

module.exports = router;

