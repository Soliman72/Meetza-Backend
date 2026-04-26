const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/verifyToken");
const { checkAdminPermission, requireSuperAdmin } = require("../middleware/checkAdminPermission");
const uploadMiddleware = require("../middleware/uploadMiddleware");

router.post("/", verifyToken, requireSuperAdmin, userController.createUserBySuperAdmin);
router.get("/", verifyToken, checkAdminPermission, userController.getAllUsers);
router.get("/:id", verifyToken, userController.getUserById);
router.get("/email/:email", verifyToken, checkAdminPermission, userController.getUserByEmail);
router.patch("/:id", verifyToken, uploadMiddleware, userController.updateUser);
router.delete("/:id", verifyToken, checkAdminPermission, userController.deleteUser);

module.exports = router;
