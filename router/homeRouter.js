const express = require("express");
const router = express.Router();
const { verifyToken } = require("../utils/verifyToken");
const homeController = require("../controller/homeController");

router.get("/stats", verifyToken, homeController.getHomeStats);
router.get(
  "/upcoming-meetings",
  verifyToken,
  homeController.getHomeUpcomingMeetings,
);

module.exports = router;
