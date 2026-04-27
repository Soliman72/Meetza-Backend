const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { verifyToken } = require("../middleware/verifyToken");
const { requireSuperAdmin } = require("../middleware/checkAdminPermission");

router.get("/", verifyToken, requireSuperAdmin, companyController.list);
router.get("/:id", verifyToken, requireSuperAdmin, companyController.getById);
router.post("/", verifyToken, requireSuperAdmin, companyController.provision);

module.exports = router;
