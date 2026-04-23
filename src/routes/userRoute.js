const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const { verifyToken } = require("../middleware/verifyToken");
const { checkAdminPermission } = require("../middleware/checkAdminPermission");
const uploadMiddleware = require("../middleware/uploadMiddleware");

router.get("/", verifyToken, checkAdminPermission, controller.getAllUsers);
router.get("/:id", verifyToken, checkAdminPermission, controller.getUserById);
router.get("/email/:email", verifyToken, checkAdminPermission, controller.getUserByEmail);
router.patch("/:id", verifyToken, uploadMiddleware, controller.updateUser);
router.delete("/:id", verifyToken, checkAdminPermission, controller.deleteUser);

module.exports = router;
