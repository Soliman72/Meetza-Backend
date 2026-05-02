const express = require("express");
const router = express.Router();
const controller = require("../controllers/social_authController");
const { verifyToken } = require("../middleware/verifyToken");


router.get("/", verifyToken, controller.getAllSocialAuths);
router.get("/:id", verifyToken, controller.getSocialAuthById);
router.patch("/:id", verifyToken, controller.updateSocialAuth);
router.delete("/:id", verifyToken, controller.deleteSocialAuth);

module.exports = router;
