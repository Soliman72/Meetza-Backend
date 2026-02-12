const express = require("express");
const router = express.Router();
const groupContentController = require("../controller/groupContentController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get("/", verifyToken, groupContentController.getAllGroupContents);

router.get("/:id", verifyToken, groupContentController.getGroupContentById);
router.put(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupContentController.updateGroupContentById
);
router.post(
  "/:id/files",
  verifyToken,
  checkAdminPermission,
  groupContentController.addFilesToGroupContent
);
router.delete(
  "/:id/files/:resourceId",
  verifyToken,
  checkAdminPermission,
  groupContentController.deleteFileFromGroupContent
);
router.get(
  "/meeting/:meeting_id",
  verifyToken,
  groupContentController.getGroupContentResourcesByMeetingId
);
module.exports = router;
