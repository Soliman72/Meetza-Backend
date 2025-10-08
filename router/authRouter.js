const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

// Register route
router.post("/register", authController.register);

// Login route
// router.post("/login", authController.login);

// Get current user route
// router.get("/me", authController.verifyToken, authController.getCurrentUser);

module.exports = router;
