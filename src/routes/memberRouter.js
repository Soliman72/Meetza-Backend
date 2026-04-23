const express = require("express");
const router = express.Router();
const controller = require("../controllers/memberController");
const { verifyToken } = require("../middleware/verifyToken");


router.get("/", verifyToken, controller.getAllMembers);
router.get("/:id", verifyToken, controller.getMemberById);
router.patch("/:id", verifyToken, controller.updateMember);
router.delete("/:id", verifyToken, controller.deleteMember);

module.exports = router;
