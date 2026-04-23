const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { verifyToken } = require("../middleware/verifyToken");
const { checkAdminPermission } = require("../middleware/checkAdminPermission");

/**
 * @route   GET /api/reports/analytics
 * @desc    Get analytics report for administrators
 * @access  Private (Administrator, Super_Admin)
 */
router.get(
  "/analytics",
  verifyToken,
  checkAdminPermission,
  reportController.getAnalyticsReport
);

module.exports = router;
