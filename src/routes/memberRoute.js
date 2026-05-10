const express = require("express");
const router = express.Router();
const controller = require("../controllers/memberController");
const { verifyToken } = require("../middleware/verifyToken");
const { requireSuperAdmin } = require("../middleware/checkAdminPermission");



router.get("/", verifyToken, requireSuperAdmin, controller.getAllMembers);
router.get("/:id", verifyToken, requireSuperAdmin, controller.getMemberById);
router.patch("/:id", verifyToken, requireSuperAdmin, controller.updateMember);
router.delete("/:id", verifyToken, requireSuperAdmin, controller.deleteMember);

module.exports = router;
