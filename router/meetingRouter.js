const express = require("express");
const router = express.Router();
const meetingController = require("../controller/meetingController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdmin } = require("../utils/checkAdmin");

router.get("/", verifyToken, checkAdmin, meetingController.getAllMeetings);
router.post("/", verifyToken, checkAdmin, meetingController.createMeeting);
router.get("/:id", verifyToken, checkAdmin, meetingController.getMeetingById);
router.put(
  "/:id",
  verifyToken,
  checkAdmin,
  meetingController.updateMeetingById
);
router.delete(
  "/:id",
  verifyToken,
  checkAdmin,
  meetingController.deleteMeetingById
);

module.exports = router;
