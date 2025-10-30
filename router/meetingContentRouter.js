const express = require("express");
const router = express.Router();
const meetingContentController = require("../controller/meetingContentController");
const { verifyToken } = require("../utils/verifyToken");

router.get("/", verifyToken, meetingContentController.getAllMeetingContents);
router.post("/", verifyToken, meetingContentController.createMeetingContent);
router.get("/:id", verifyToken, meetingContentController.getMeetingContentById);
router.patch("/:id", verifyToken, meetingContentController.updateMeetingContentById);
router.delete("/:id", verifyToken, meetingContentController.deleteMeetingContentById);

module.exports = router;
