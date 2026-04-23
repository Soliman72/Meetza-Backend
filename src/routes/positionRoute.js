const express = require("express");
const router = express.Router();
const positionController = require("../controllers/positionController");
const { verifyToken } = require("../middleware/verifyToken");
const { checkAdminPermission } = require("../middleware/checkAdminPermission");

router.get("/", verifyToken, checkAdminPermission, positionController.getAllPositions);
router.post("/", verifyToken, checkAdminPermission, positionController.createPosition);
router.get("/:id", verifyToken, checkAdminPermission, positionController.getPositionById);
router.put("/:id", verifyToken, checkAdminPermission, positionController.updatePosition);
router.delete("/:id", verifyToken, checkAdminPermission, positionController.deletePosition);

module.exports = router;
