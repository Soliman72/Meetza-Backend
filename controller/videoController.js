const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");
const { upload, uploadToCloudinary } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");

// Create a video with file upload
exports.createVideo = (req, res) => {
  // Apply multer upload middleware to handle file uploads
  upload.fields([
    { name: "video_file", maxCount: 1 },
    { name: "poster_file", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      const { title, meeting_id, date_recorded, description } = req.body;
      const id = uuidv4();

      // Ensure both files are uploaded
      if (!req.files && (!req.body.video_file || !req.body.poster_file)) {
        return res.status(400).json({
          success: false,
          message: "Both video and poster files are required",
        });
      }

      let videoUrl = "";
      let posterUrl = "";

      if (req.files.video_file && req.files.poster_file) {
        const videoFile = req.files.video_file[0];
        const posterFile = req.files.poster_file[0];

        // Validate file types BEFORE uploading
        validateFileType(videoFile, "video");
        validateFileType(posterFile, "image");

        // Upload files to Cloudinary
        videoUrl = await uploadToCloudinary(videoFile, "videos");
        posterUrl = await uploadToCloudinary(posterFile, "posters");
      } else if (req.body.video_file && req.body.poster_file) {
        // If URLs are provided in the body (from OneDrive or SharePoint directly)

        // Validate file types BEFORE uploading
        validateFileType(req.body.video_file, "video");
        validateFileType(req.body.poster_file, "image");

        videoUrl = req.body.video_file; // Assuming it's a URL
        posterUrl = req.body.poster_file; // Assuming it's a URL
      }


      // Validate required fields
      if (!meeting_id || !title || !date_recorded || !description)  {
        return res.status(400).json({
          success: false,
          message: "meeting_id, title, description, and date_recorded are required",
        });
      }

      const meetingCheckQuery = "SELECT * FROM meeting WHERE id = ?";
      const [meetingRows] = await db
        .promise()
        .query(meetingCheckQuery, [meeting_id]);

      if (meetingRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }

      // Check if user is authenticated and has a valid id
      if (req.user && req.user.id !== undefined) {
        req.body.administrator_id = req.user.id;
      } else {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: administrator_id is required",
        });
      }

      // Insert the video into the database
      const query =
        "INSERT INTO video (id,title , meeting_id, video_url, poster_url, administrator_id, date_recorded, description ) VALUES (?, ?, ?, ?, ?, ?, ? ,?)";
      await db.promise().query(query, [
        id,
        title,
        meeting_id,
        videoUrl, // Store the video file path
        posterUrl, // Store the poster file path
        req.body.administrator_id,
        date_recorded,
        description,
      ]);

      return res.status(201).json({
        success: true,
        message: "Video created successfully",
        data: {
          id,
          title,
          meeting_id,
          video_url: videoUrl,
          poster_url: posterUrl,
          date_recorded,
          description,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
  });
};

exports.getAllVideos = async (req, res) => {
  try {
    const { title } = req.query;
    let query = "SELECT * FROM video";
    let params = [];

    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(req, "administrator_id");
    if (ownershipFilter.whereClause) {
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    if (title) {
      query += ownershipFilter.whereClause ? " AND" : " WHERE";
      query += " title LIKE ?";
      params.push(`%${title}%`);
    }

    const [results] = await db.promise().query(query, params);
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

exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Video id is required",
      });
    }
    let query = "SELECT * FROM video WHERE id = ?";
    let params = [id];

    // Apply ownership filter for regular admins
    if (!req.isSuperAdmin) {
      query += " AND administrator_id = ?";
      params.push(req.administratorId);
    }

    const [results] = await db.promise().query(query, params);
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: results[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Video id is required",
      });
    }
    const query = "DELETE FROM video WHERE id = ?";
    const [result] = await db.promise().query(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Update video by ID
exports.updateVideo = (req, res) => {
  upload.fields([
    { name: "video_file", maxCount: 1 },
    { name: "poster_file", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "id is required",
        });
      }

      // Check if video exists
      const [oldVideo] = await db
        .promise()
        .query("SELECT * FROM video WHERE id = ?", [id]);
      if (oldVideo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      const updateFields = [];
      const updateParams = [];

      // Handle basic fields from body
      const { title, meeting_id, date_recorded, description } = req.body;
      if (typeof title !== "undefined") {
        updateFields.push("title = ?");
        updateParams.push(title);
      }
      if (typeof meeting_id !== "undefined") {
        // Check if meeting exists if updating meeting_id
        const meetingCheckQuery = "SELECT * FROM meeting WHERE id = ?";
        const [meetingRows] = await db
          .promise()
          .query(meetingCheckQuery, [meeting_id]);
        if (meetingRows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Meeting not found",
          });
        }
        updateFields.push("meeting_id = ?");
        updateParams.push(meeting_id);
      }
      if (typeof date_recorded !== "undefined") {
        updateFields.push("date_recorded = ?");
        updateParams.push(date_recorded);
      }
      if (typeof description !== "undefined") {
        updateFields.push("description = ?");
        updateParams.push(description);
      }
      // Handle video/poster file updates
      let newVideoUrl, newPosterUrl;

      if (req.files && req.files.video_file) {
        const videoFile = req.files.video_file[0];
        validateFileType(videoFile, "video");
        newVideoUrl = await uploadToCloudinary(videoFile, "videos");
        updateFields.push("video_url = ?");
        updateParams.push(newVideoUrl);
      } else if (req.body.video_file) {
        validateFileType(req.body.video_file, "video");
        newVideoUrl = req.body.video_file;
        updateFields.push("video_url = ?");
        updateParams.push(newVideoUrl);
      }

      if (req.files && req.files.poster_file) {
        const posterFile = req.files.poster_file[0];
        validateFileType(posterFile, "image");
        newPosterUrl = await uploadToCloudinary(posterFile, "posters");
        updateFields.push("poster_url = ?");
        updateParams.push(newPosterUrl);
      } else if (req.body.poster_file) {
        validateFileType(req.body.poster_file, "image");
        newPosterUrl = req.body.poster_file;
        updateFields.push("poster_url = ?");
        updateParams.push(newPosterUrl);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No new data provided for update",
        });
      }

      updateParams.push(id);

      const sql = `UPDATE video SET ${updateFields.join(", ")} WHERE id = ?`;
      const [result] = await db.promise().query(sql, [...updateParams, id]);

      return res.status(200).json({
        success: true,
        message: "Video updated successfully",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
  });
};
