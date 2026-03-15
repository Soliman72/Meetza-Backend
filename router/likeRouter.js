const express = require("express");
const router = express.Router();
const likeController = require("../controller/likeController");
const { verifyToken } = require("../utils/verifyToken");

// Like a video
router.post("/", verifyToken, likeController.createLike);

// Get likes/dislikes for a video
router.get("/video/:video_id", verifyToken, likeController.getLikesByVideoId);

// Get likes/dislikes by a user
router.get("/user", verifyToken, likeController.getLikesByUserId); // no need for `user_id` in URL

// Update a like/dislike (toggle)
router.put("/", verifyToken, likeController.updateLike);

// Delete a like/dislike
router.delete("/:video_id", verifyToken, likeController.deleteLike); // `member_id` comes from `req.user.id`

module.exports = router;
