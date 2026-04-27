const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { verifyToken } = require("../middleware/verifyToken");
const { requireSuperAdmin } = require("../middleware/checkAdminPermission");
const uploadMiddleware = require("../middleware/uploadMiddleware");


router.get("/", verifyToken, requireSuperAdmin, companyController.list);
router.post("/", verifyToken, requireSuperAdmin, companyController.provision);

router.patch("/:id/settings", verifyToken, requireSuperAdmin, companyController.patchSettings);
router.patch(
  "/:id/logo",
  verifyToken, requireSuperAdmin,
  uploadMiddleware,
  companyController.patchLogo
);

router.post("/:id/domains", verifyToken, requireSuperAdmin, companyController.addDomain);
router.patch("/:id/domains/:domainId", verifyToken, requireSuperAdmin, companyController.updateDomain);
router.delete("/:id/domains/:domainId", verifyToken, requireSuperAdmin, companyController.removeDomain);

router.get("/:id", companyController.getById);
router.patch("/:id", verifyToken, requireSuperAdmin, companyController.update);
router.delete("/:id", verifyToken, requireSuperAdmin, companyController.remove);

module.exports = router;
