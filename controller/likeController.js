const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.createLike = async (req, res) => {
  try {
    const { video_id, like_type } = req.body;
    const member_id = req.user?.id;

    // Validate fields
    if (!member_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: member not found",
      });
    }
    if (!video_id || like_type === undefined) {
      return res.status(400).json({
        success: false,
        message: "video_id and like_type are required",
      });
    }
    if (![0, 1].includes(Number(like_type))) {
      return res.status(400).json({
        success: false,
        message: "like_type must be 0 (dislike) or 1 (like)",
      });
    }

    // Check if video exists
    const videoQuery = "SELECT id FROM video WHERE id = ?";
    const [video] = await db.promise().query(videoQuery, [video_id]);
    if (video.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check if member exists
    const memberQuery = "SELECT user_id FROM member WHERE user_id = ?";
    const [member] = await db.promise().query(memberQuery, [member_id]);
    if (member.length === 0) {
      throw new Error("Member not found");
    }

    // Check if user already liked/disliked this video
    const checkQuery =
      "SELECT id, like_type FROM `like` WHERE member_id = ? AND video_id = ?";
    const [existing] = await db
      .promise()
      .query(checkQuery, [member_id, video_id]);

    if (existing.length > 0) {
      // If user already liked/disliked — just update instead of inserting new
      if (existing[0].like_type === like_type) {
        return res.status(200).json({
          success: true,
          message:
            like_type === 1
              ? "Already liked this video"
              : "Already disliked this video",
        });
      }

      // If user changes from like→dislike or vice versa
      const updateQuery = "UPDATE `like` SET like_type = ? WHERE id = ?";
      await db.promise().query(updateQuery, [like_type, existing[0].id]);

      return res.status(200).json({
        success: true,
        message:
          like_type === 1
            ? "Changed to Like successfully"
            : "Changed to Dislike successfully",
      });
    }

    // Insert new like/dislike
    const id = uuidv4();
    const insertQuery =
      "INSERT INTO `like` (id, member_id, video_id, like_type) VALUES (?, ?, ?, ?)";
    await db.promise().query(insertQuery, [id, member_id, video_id, like_type]);

    return res.status(201).json({
      success: true,
      message:
        like_type === 1
          ? "Video liked successfully"
          : "Video disliked successfully",
      data: { id, member_id, video_id, like_type },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Get all likes/dislikes for a video
exports.getLikesByVideoId = async (req, res) => {
  try {
    const { video_id } = req.params;

    // Validate video_id
    if (!video_id) {
      return res.status(400).json({
        success: false,
        message: "video_id is required",
      });
    }

    // Get all likes/dislikes for the video
    const query = "SELECT * FROM `like` WHERE video_id = ?";
    const [results] = await db.promise().query(query, [video_id]);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Get all likes/dislikes by a member
exports.getLikesByMemberId = async (req, res) => {
  try {
    const member_id = req.user.id; // Get member_id from authenticated user

    // Get all likes/dislikes for the member
    const query = "SELECT * FROM `like` WHERE member_id = ?";
    const [results] = await db.promise().query(query, [member_id]);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Update a like/dislike for a video (toggle like/dislike)
exports.updateLike = async (req, res) => {
  try {
    const member_id = req.user.id; // Get member_id from authenticated user
    const { video_id, like_type } = req.body;

    // Validate like_type (0 or 1)
    if (![0, 1].includes(like_type)) {
      return res.status(400).json({
        success: false,
        message: "like_type must be 0 (dislike) or 1 (like)",
      });
    }

    // Check if the like/dislike exists
    const query = "SELECT * FROM `like` WHERE member_id = ? AND video_id = ?";
    const [existingLike] = await db
      .promise()
      .query(query, [member_id, video_id]);

    if (existingLike.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Like/Dislike not found",
      });
    }

    // Update the like/dislike in the database
    const updateQuery =
      "UPDATE `like` SET like_type = ? WHERE member_id = ? AND video_id = ?";
    await db.promise().query(updateQuery, [like_type, member_id, video_id]);

    return res.status(200).json({
      success: true,
      message: "Like/Dislike updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Delete a like/dislike for a video
exports.deleteLike = async (req, res) => {
  try {
    const member_id = req.user.id; // Get member_id from authenticated user
    const { video_id } = req.params;

    // Validate video_id
    if (!video_id) {
      return res.status(400).json({
        success: false,
        message: "video_id is required",
      });
    }

    // Delete the like/dislike from the database
    const query = "DELETE FROM `like` WHERE member_id = ? AND video_id = ?";
    const [result] = await db.promise().query(query, [member_id, video_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Like/Dislike not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Like/Dislike removed successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};
