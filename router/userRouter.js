const express = require("express");
const router = express.Router();
const controller = require("../controller/userController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get("/", verifyToken, checkAdminPermission, controller.getAllUsers);
router.get("/:id", verifyToken, checkAdminPermission, controller.getUserById);
router.patch("/:id", verifyToken, controller.updateUser);
router.delete("/:id", verifyToken, checkAdminPermission, controller.deleteUser);

module.exports = router;
