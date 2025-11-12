const express = require("express");
const router = express.Router();
const meetingContentController = require("../controller/meetingContentController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  meetingContentController.getAllMeetingContents
);
router.post(
  "/",
  verifyToken,
  checkAdminPermission,
  meetingContentController.createMeetingContent
);
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  meetingContentController.getMeetingContentById
);
router.put(
  "/:id",
  verifyToken,
  checkAdminPermission,
  meetingContentController.updateMeetingContentById
);
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  meetingContentController.deleteMeetingContentById
);

module.exports = router;
