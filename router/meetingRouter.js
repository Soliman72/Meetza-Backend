const express = require("express");
const router = express.Router();
const meetingController = require("../controller/meetingController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  meetingController.getAllMeetings
);
router.post(
  "/",
  verifyToken,
  checkAdminPermission,
  meetingController.createMeeting
);
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  meetingController.getMeetingById
);
router.put(
  "/:id",
  verifyToken,
  checkAdminPermission,
  meetingController.updateMeetingById
);
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  meetingController.deleteMeetingById
);

module.exports = router;
