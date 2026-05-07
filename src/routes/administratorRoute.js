const express = require("express");
const router = express.Router();
const controller = require("../controllers/administratorController");
const { verifyToken } = require("../middleware/verifyToken");
const { requireSuperAdmin } = require("../middleware/checkAdminPermission");


router.get("/", verifyToken, requireSuperAdmin, controller.getAllAdministrators);
router.get("/:id", verifyToken, requireSuperAdmin, controller.getAdministratorById);
router.patch("/:id", verifyToken, requireSuperAdmin, controller.updateAdministrator);
router.delete("/:id", verifyToken, requireSuperAdmin, controller.deleteAdministrator);

module.exports = router;
