const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");
const { verifyToken } = require("../utils/verifyToken");
const { checkAdminPermission } = require("../utils/checkAdminPermission");

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
