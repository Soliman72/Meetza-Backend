const express = require("express");
const router = express.Router();
const commentController = require("../controller/commentController");
const { verifyToken } = require("../utils/verifyToken");

// Create a comment
router.post("/", verifyToken, commentController.createComment);
// Get comments for a video
router.get("/video/:video_id", commentController.getCommentsByVideoId);
// Get comments by a user
router.get("/user", verifyToken, commentController.getCommentsByUserId); // no need for `user_id` in URL
// get a specific comment
router.get("/:id", verifyToken, commentController.getCommentById);
// Update a comment
router.patch("/:id", verifyToken, commentController.updateComment);
// Delete a comment
router.delete("/:id", verifyToken, commentController.deleteComment);

module.exports = router;
