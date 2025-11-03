const express = require("express");
const router = express.Router();
const positionController = require("../controller/positionController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdmin } = require("../utils/checkAdmin");

router.get("/", verifyToken, checkAdmin, positionController.getAllPositions);
router.post("/", verifyToken, checkAdmin, positionController.createPosition);
router.get("/:id", verifyToken, checkAdmin, positionController.getPositionById);
router.put("/:id", verifyToken, checkAdmin, positionController.updatePosition);
router.delete("/:id", verifyToken, checkAdmin, positionController.deletePosition);

module.exports = router;