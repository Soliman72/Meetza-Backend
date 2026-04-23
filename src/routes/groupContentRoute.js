const express = require("express");
const router = express.Router();
const controller = require("../controllers/groupContentController");
const { verifyToken } = require("../middleware/verifyToken");
const { checkAdminPermission } = require("../middleware/checkAdminPermission");

router.post(
  "/",
  verifyToken,
  checkAdminPermission,
  controller.createGroupContentFromBody
);
router.get("/", verifyToken, controller.getAllGroupContents);

module.exports = router;
