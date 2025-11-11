const express = require("express");
const router = express.Router();
const controller = require("../controller/administratorController");
const { verifyToken } = require("../utils/verifyToken");

router.get("/", verifyToken, controller.getAllAdministrators);
router.get("/:id", verifyToken, controller.getAdministratorById);
router.patch("/:id", verifyToken, controller.updateAdministrator);
router.delete("/:id", verifyToken, controller.deleteAdministrator);

module.exports = router;
