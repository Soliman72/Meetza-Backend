const express = require("express");
const profileController = require("../controllers/profileController");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

router.get("/", verifyToken, profileController.getMyProfile);
router.get("/chat-media", verifyToken, profileController.getMyChatMedia);

module.exports = router;
