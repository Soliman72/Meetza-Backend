const express = require("express");
const router = express.Router();
const likeController = require("../controllers/likeController");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/", verifyToken, likeController.createLike);
router.get("/video/:video_id", verifyToken, likeController.getLikesByVideoId);
router.get("/user", verifyToken, likeController.getLikesByUserId);
router.put("/", verifyToken, likeController.updateLike);
router.delete("/:video_id", verifyToken, likeController.deleteLike);

module.exports = router;
