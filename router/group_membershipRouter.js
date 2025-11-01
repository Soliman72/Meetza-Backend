const express = require("express");
const router = express.Router();
const groupMembershipController = require("../controller/group_membershipController");
const { verifyToken } = require("../utils/verifyToken");

router.get("/", verifyToken, groupMembershipController.getAllGroupMemberships);
router.post("/", verifyToken, groupMembershipController.createGroupMembership);
router.get("/:id", verifyToken, groupMembershipController.getGroupMembershipById);
router.put("/:id", verifyToken, groupMembershipController.updateGroupMembership);
router.delete("/:id", verifyToken, groupMembershipController.deleteGroupMembership);

module.exports = router;