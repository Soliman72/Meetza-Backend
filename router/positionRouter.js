const express = require("express");
const router = express.Router();
const positionController = require("../controller/positionController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

router.get(
  "/",
  verifyToken,
  checkAdminPermission,
  positionController.getAllPositions
);
router.post(
  "/",
  verifyToken,
  checkAdminPermission,
  positionController.createPosition
);
router.get(
  "/:id",
  verifyToken,
  checkAdminPermission,
  positionController.getPositionById
);
router.put(
  "/:id",
  verifyToken,
  checkAdminPermission,
  positionController.updatePosition
);
router.delete(
  "/:id",
  verifyToken,
  checkAdminPermission,
  positionController.deletePosition
);

module.exports = router;
