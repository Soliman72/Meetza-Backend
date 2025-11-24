const express = require("express");
const router = express.Router();
const groupContentController = require("../controller/groupContentController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  groupContentController.getAllGroupContents
);
router.post(
  "/",
  verifyToken,
  checkAdminPermission,
  groupContentController.createGroupContent
);
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupContentController.getGroupContentById
);
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
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupContentController.deleteGroupContentById
);

module.exports = router;
