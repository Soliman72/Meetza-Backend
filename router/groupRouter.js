const express = require("express");
const router = express.Router();
const groupController = require("../controller/groupController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  groupController.getAllGroups
);
router.post(
  "/",
  verifyToken,
  checkAdminPermission,
  groupController.createGroup
);
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupController.getGroupById
);
router.put(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupController.updateGroup
);
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupController.deleteGroup
);

module.exports = router;
