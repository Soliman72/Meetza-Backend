const express = require("express");
const router = express.Router();
const chatBotController = require("../controllers/chatBotController");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/message", verifyToken, chatBotController.chat);

module.exports = router;
