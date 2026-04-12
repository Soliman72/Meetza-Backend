const express = require("express");
const router = express.Router();
const { verifyToken } = require("../utils/verifyToken");
const homeController = require("../controller/homeController");

router.get("/stats", verifyToken, homeController.getHomeStats);

module.exports = router;
