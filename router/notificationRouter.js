const express = require("express");
const router = express.Router();
const { verifyToken } = require("../utils/verifyToken");
const notificationController = require("../controller/notificationController");

router.get(
  "/",
  verifyToken,
  notificationController.getMemberNotifications
);
router.get(
  "/unread-count",
  verifyToken,
  notificationController.getUnreadCount
);
router.put(
  "/:id/mark-as-read",
  verifyToken,
  notificationController.markAsRead
);

router.put(
  "/mark-all-as-read",
  verifyToken,
  notificationController.markAllAsRead
);

router.delete(
  "/:id",
  verifyToken,
  notificationController.deleteNotification
);


module.exports = router;