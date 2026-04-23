const express = require("express");
const router = express.Router();
const groupContentController = require("../controllers/groupContentController");
const { verifyToken } = require("../middleware/verifyToken");
const { checkAdminPermission } = require("../middleware/checkAdminPermission");

router.get("/", verifyToken, groupContentController.getAllGroupContents);
router.get(
  "/meeting/:meeting_id",
  verifyToken,
  groupContentController.getGroupContentResourcesByMeetingId
);
router.get("/:id", verifyToken, groupContentController.getGroupContentById);
router.put("/:id", verifyToken, checkAdminPermission, groupContentController.updateGroupContentById);
router.post("/:id/files", verifyToken, checkAdminPermission, groupContentController.addFilesToGroupContent);
router.delete("/:id/files/:resourceId", verifyToken, checkAdminPermission, groupContentController.deleteFileFromGroupContent);

module.exports = router;
