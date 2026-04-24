const express = require("express");
const router = express.Router();
const domainController = require("../controllers/domainController");
const { verifyToken } = require("../middleware/verifyToken");

// Middleware to restrict access to Super_Admin
const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Super_Admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Access denied. Super Admins only." });
  }
};

router.get("/", verifyToken, requireSuperAdmin, domainController.getAllDomains);
router.get("/:id", verifyToken, requireSuperAdmin, domainController.getDomainById);
router.post("/", verifyToken, requireSuperAdmin, domainController.createDomain);
router.patch("/:id", verifyToken, requireSuperAdmin, domainController.updateDomain);
router.delete("/:id", verifyToken, requireSuperAdmin, domainController.deleteDomain);

module.exports = router;
