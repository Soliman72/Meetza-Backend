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
  "/groups/:groupId/messages/:messageId/update",
  verifyToken,
  chatController.updateMessage
);

// Read/Unread messages endpoints
router.put(
  "/groups/:groupId/messages/:messageId/read",
  verifyToken,
  chatController.markMessageAsRead
);

router.put(
  "/groups/:groupId/messages/:messageId/unread",
  verifyToken,
  chatController.markMessageAsUnread
);

router.put(
  "/groups/:groupId/messages/read-all",
  verifyToken,
  chatController.markAllMessagesAsRead
);

router.get(
  "/groups/:groupId/messages/read",
  verifyToken,
  chatController.getReadMessages
);

router.get(
  "/groups/:groupId/messages/unread",
  verifyToken,
  chatController.getUnreadMessages
);

router.get(
  "/groups/:groupId/unread-count",
  verifyToken,
  chatController.getUnreadCount
);

// router.get(
//   "/groups/:groupId/meetings",
//   verifyToken,
//   chatController.getGroupMeetings
// );

module.exports = router;
