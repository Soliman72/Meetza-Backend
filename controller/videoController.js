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
      const { title, meeting_id, date_recorded } = req.body;
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

      console.log(videoUrl, posterUrl);

      // Validate required fields
      if (!meeting_id || !title || !date_recorded) {
        return res.status(400).json({
          success: false,
          message: "meeting_id, title, and date_recorded are required",
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
        "INSERT INTO video (id,title , meeting_id, video_url, poster_url, administrator_id, date_recorded ) VALUES (?, ?, ?, ?, ?, ?, ? )";
      await db.promise().query(query, [
        id,
        title,
        meeting_id,
        videoUrl, // Store the video file path
        posterUrl, // Store the poster file path
        req.body.administrator_id,
        date_recorded,
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
      const { id } = req.params;
      const { title, meeting_id, date_recorded } = req.body;

      // Validate required fields
      if (!id || !meeting_id || !title || !date_recorded) {
        return res.status(400).json({
          success: false,
          message: "id, meeting_id, title, and date_recorded are required",
        });
      }

      // Check if meeting exists
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

      // Get old video and poster URLs from the database
      const [oldVideo] = await db
        .promise()
        .query("SELECT * FROM video WHERE id = ?", [id]);
      if (oldVideo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      // Get the new file paths if uploaded
      let videoFilePath = oldVideo[0].video_url;
      let posterFilePath = oldVideo[0].poster_url;

      if (req.files) {
        if (req.files.video_file) {
          videoFilePath = `/uploads/${req.files.video_file[0].filename}`;
        }
        if (req.files.poster_file) {
          posterFilePath = `/uploads/${req.files.poster_file[0].filename}`;
        }
      }

      // Update the video in the database
      const query =
        "UPDATE video SET title = ?, meeting_id = ?, video_url = ?, poster_url = ?, date_recorded = ? WHERE id = ?";
      await db
        .promise()
        .query(query, [
          title,
          meeting_id,
          videoFilePath,
          posterFilePath,
          date_recorded,
          id,
        ]);

      return res.status(200).json({
        success: true,
        message: "Video updated successfully",
        data: {
          id,
          title,
          meeting_id,
          video_url: videoFilePath,
          poster_url: posterFilePath,
          date_recorded,
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
