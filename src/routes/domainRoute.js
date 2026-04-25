const express = require("express");
const router = express.Router();
const domainController = require("../controllers/domainController");
const { verifyToken } = require("../middleware/verifyToken");
const { requireSuperAdmin } = require("../middleware/checkSuperAdminPermission");

router.get("/", verifyToken, requireSuperAdmin, domainController.getAllDomains);
router.get("/:id", verifyToken, requireSuperAdmin, domainController.getDomainById);
router.post("/", verifyToken, requireSuperAdmin, domainController.createDomain);
router.patch("/:id", verifyToken, requireSuperAdmin, domainController.updateDomain);
router.delete("/:id", verifyToken, requireSuperAdmin, domainController.deleteDomain);

module.exports = router;
