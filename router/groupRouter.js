const express = require("express");
const router = express.Router();
const groupController = require("../controller/groupController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdmin } = require("../utils/checkAdmin");

router.get("/", verifyToken, checkAdmin, groupController.getAllGroups);
router.post("/", verifyToken, checkAdmin, groupController.createGroup);
router.get("/:id", verifyToken, checkAdmin, groupController.getGroupById);
router.put("/:id", verifyToken, checkAdmin, groupController.updateGroup);
router.delete("/:id", verifyToken, checkAdmin, groupController.deleteGroup);

module.exports = router;