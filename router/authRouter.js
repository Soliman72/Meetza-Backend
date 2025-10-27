const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

// Register route
router.post("/register", authController.register);
router.post("/verify", authController.verifyEmail);
router.post("/forgot_password", authController.forgotPassword);
router.post("/verify_code", authController.verifyCode);
router.post("/reset_password", authController.resetPassword);

// Login route
router.post("/login", authController.login);

// Social auth routes
router.get('/social/:platform', authController.socialAuth);
router.get('/social/:platform/callback', authController.socialAuthCallback);



// Get current user route
// router.get("/me", authController.verifyToken, authController.getCurrentUser);

module.exports = router;
