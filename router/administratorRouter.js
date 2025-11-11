const express = require("express");
const router = express.Router();
const controller = require("../controller/administratorController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  controller.getAllAdministrators
);
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  controller.getAdministratorById
);
router.patch(
  "/:id",
  verifyToken,
  checkAdminPermission,
  controller.updateAdministrator
);
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  controller.deleteAdministrator
);

module.exports = router;
