const express = require("express");
const router = express.Router();
const meetingController = require("../controller/meetingController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

// Admin: list all meetings (ownership filtered for non–super admins)
router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  meetingController.getAllMeetings
);
// Admin: create meeting (group admin only; no overlapping times)
router.post(
  "/",
  verifyToken,
  checkAdminPermission,
  meetingController.createMeeting
);

// Group meetings: any authenticated user with group access (admin or member)
router.get(
  "/group/:group_id",
  verifyToken,
  meetingController.getMeetingsByGroup
);

// Get single meeting: admin (ownership filtered) or group member can view
router.get("/:id", verifyToken, meetingController.getMeetingById);
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

// Admin: save meeting recording as video (multipart: video_file, optional poster_file, title, description)
router.post(
  "/:id/save-recording",
  verifyToken,
  checkAdminPermission,
  meetingController.saveMeetingRecording
);

// Members: join or leave a meeting (must be member of the meeting’s group)
router.post("/:id/join", verifyToken, meetingController.joinMeeting);
router.post("/:id/leave", verifyToken, meetingController.leaveMeeting);

// Participants list: meeting admin or group members can view
router.get(
  "/:id/participants",
  verifyToken,
  meetingController.getMeetingParticipants
);

module.exports = router;
