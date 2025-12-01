const express = require("express");
const router = express.Router();
const groupMembershipController = require("../controller/group_membershipController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  groupMembershipController.getAllGroupMemberships
);
router.post(
  "/",
  verifyToken,
  groupMembershipController.createGroupMembership
);
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupMembershipController.getGroupMembershipById
);
router.put(
  "/:id",
  verifyToken,
  checkAdminPermission,
  groupMembershipController.updateGroupMembership
);
router.delete(
  "/:id",
  verifyToken,
  groupMembershipController.deleteGroupMembership
);

module.exports = router;
