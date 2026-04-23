const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const homeController = require("../controllers/homeController");

router.get("/stats", verifyToken, homeController.getHomeStats);
router.get(
  "/upcoming-meetings",
  verifyToken,
  homeController.getHomeUpcomingMeetings
);
router.get(
  "/most-interested-videos",
  verifyToken,
  homeController.getHomeMostInterestedVideos
);
router.get("/leaders", verifyToken, homeController.getHomeLeaders);
router.get("/saved-videos", verifyToken, homeController.getHomeSavedVideos);

module.exports = router;
