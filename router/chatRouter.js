const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatController");
const { verifyToken } = require("../utils/verifyToken");

// chats/
router.get("/groups", verifyToken, chatController.getMyGroups);

router.get(
  "/groups/:groupId/messages",
  verifyToken,
  chatController.getGroupMessages
);

router.post(
  "/groups/:groupId/messages",
  verifyToken,
  chatController.sendMessage
);

router.get("/groups/:groupId/info", verifyToken, chatController.getGroupInfo);

router.delete(
  "/groups/:groupId/messages/:messageId",
  verifyToken,
  chatController.deleteMessage
);

router.put(
  "/groups/:groupId/messages/:messageId",
  verifyToken,
  chatController.updateMessage
);

// router.get(
//   "/groups/:groupId/meetings",
//   verifyToken,
//   chatController.getGroupMeetings
// );

module.exports = router;
