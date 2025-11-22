const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");
const { upload, uploadToCloudinaryResources } = require("../utils/uploadFile");

// Controller to handle meeting content creation with file uploads
exports.createMeetingContent = (req, res) => {
  // Apply multer upload middleware to handle file uploads
  upload.array("files", 20)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      const { content_name, content_description } = req.body;
      const id = uuidv4();

      if (!content_name || !content_description || !req.user?.id) {
        return res.status(400).json({
          success: false,
          message: "Content name, description or administrator_id is required",
        });
      }

      // Insert the meeting content into the database
      const query =
        "INSERT INTO meeting_content (id, content_name, content_description, administrator_id) VALUES (?, ?, ?, ?)";
      await db
        .promise()
        .query(query, [id, content_name, content_description, req.user?.id]);

      const uploadedResources = [];

      // Handle file uploads if any files are provided
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            // Determine resource type based on file MIME type
            // Use "raw" for documents (PDF, DOC, etc.), "auto" for images/videos
            const isDocument =
              file.mimetype &&
              (file.mimetype.includes("pdf") ||
                file.mimetype.includes("document") ||
                file.mimetype.includes("msword") ||
                file.mimetype.includes("spreadsheet") ||
                file.mimetype.includes("presentation") ||
                file.mimetype.includes("text"));
            const resourceType = isDocument ? "raw" : "auto";

            // Upload file to separate Cloudinary for meeting content resources (large files)
            const fileUrl = await uploadToCloudinaryResources(
              file,
              "meeting_content_resources",
              resourceType
            );

            // Generate resource ID
            const resourceId = uuidv4();

            // Insert resource into database
            const resourceQuery =
              "INSERT INTO meeting_content_resource (id, meeting_content_id, file_url, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)";
            await db
              .promise()
              .query(resourceQuery, [
                resourceId,
                id,
                fileUrl,
                file.originalname,
                file.mimetype,
                file.size,
              ]);

            uploadedResources.push({
              id: resourceId,
              file_url: fileUrl,
              file_name: file.originalname,
              file_type: file.mimetype,
              file_size: file.size,
            });
          } catch (fileError) {
            console.error(
              `Error uploading file ${file.originalname}:`,
              fileError
            );
            // Continue with other files even if one fails
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: "Meeting content created successfully",
        data: {
          id,
          content_name,
          content_description,
          administrator_id: req.user?.id,
          resources: uploadedResources,
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

// Controller to get all meeting contents
exports.getAllMeetingContents = async (req, res) => {
  try {
    const { name } = req.query;
    let query = "SELECT * FROM meeting_content";
    let params = [];

    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(req, "administrator_id");

    if (ownershipFilter.whereClause) {
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    if (ownershipFilter.whereClause && name) {
      query += " AND content_name LIKE ?";
      params.push(`%${name}%`);
    } else if (name) {
      query += " WHERE content_name LIKE ?";
      params.push(`%${name}%`);
    }

    const [results] = await db.promise().query(query, params);

    // Fetch resources for each meeting content
    const meetingContentsWithResources = await Promise.all(
      results.map(async (meetingContent) => {
        const resourcesQuery =
          "SELECT id, file_url, file_name, file_type, file_size, created_at FROM meeting_content_resource WHERE meeting_content_id = ? ORDER BY created_at ASC";
        const [resources] = await db
          .promise()
          .query(resourcesQuery, [meetingContent.id]);

        return {
          ...meetingContent,
          resources: resources,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: meetingContentsWithResources,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to get a specific meeting content by ID
exports.getMeetingContentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Content id is required",
      });
    }

    // Get meeting content
    const query = "SELECT * FROM meeting_content WHERE id = ?";
    const [results] = await db.promise().query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting content not found",
      });
    }

    // Get associated resources
    const resourcesQuery =
      "SELECT id, file_url, file_name, file_type, file_size, created_at FROM meeting_content_resource WHERE meeting_content_id = ? ORDER BY created_at ASC";
    const [resources] = await db.promise().query(resourcesQuery, [id]);

    const meetingContent = {
      ...results[0],
      resources: resources,
    };

    return res.status(200).json({
      success: true,
      data: meetingContent,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to update meeting content by ID
exports.updateMeetingContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { content_name, content_description } = req.body;

    if (!id || !content_name || !content_description) {
      return res.status(400).json({
        success: false,
        message: "Content id, name, and description are required",
      });
    }

    const query =
      "UPDATE meeting_content SET content_name = ?, content_description = ? WHERE id = ?";
    const [result] = await db
      .promise()
      .query(query, [content_name, content_description, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting content not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Meeting content updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to add files to an existing meeting content
exports.addFilesToMeetingContent = (req, res) => {
  // Apply multer upload middleware to handle file uploads
  upload.array("files", 20)(req, res, async (err) => {
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
          message: "Content id is required",
        });
      }

      // Verify meeting content exists
      const checkQuery = "SELECT * FROM meeting_content WHERE id = ?";
      const [meetingContent] = await db.promise().query(checkQuery, [id]);

      if (meetingContent.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Meeting content not found",
        });
      }

      // Check if user has permission (ownership check)
      const ownershipFilter = getOwnershipFilter(req, "administrator_id");
      if (ownershipFilter.whereClause) {
        const [userContent] = await db
          .promise()
          .query(
            `SELECT * FROM meeting_content ${ownershipFilter.whereClause} AND id = ? `,
            [...ownershipFilter.params, id]
          );
        if (userContent.length === 0) {
          return res.status(403).json({
            success: false,
            message:
              "You don't have permission to add files to this meeting content",
          });
        }
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files provided",
        });
      }

      const uploadedResources = [];

      // Handle file uploads
      for (const file of req.files) {
        try {
          // Determine resource type based on file MIME type
          // Use "raw" for documents (PDF, DOC, etc.), "auto" for images/videos
          const isDocument =
            file.mimetype &&
            (file.mimetype.includes("pdf") ||
              file.mimetype.includes("document") ||
              file.mimetype.includes("msword") ||
              file.mimetype.includes("spreadsheet") ||
              file.mimetype.includes("presentation") ||
              file.mimetype.includes("text"));
          const resourceType = isDocument ? "raw" : "auto";

          // Upload file to separate Cloudinary for meeting content resources (large files)
          const fileUrl = await uploadToCloudinaryResources(
            file,
            "meeting_content_resources",
            resourceType
          );

          // Generate resource ID
          const resourceId = uuidv4();

          // Insert resource into database
          const resourceQuery =
            "INSERT INTO meeting_content_resource (id, meeting_content_id, file_url, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)";
          await db
            .promise()
            .query(resourceQuery, [
              resourceId,
              id,
              fileUrl,
              file.originalname,
              file.mimetype,
              file.size,
            ]);

          uploadedResources.push({
            id: resourceId,
            file_url: fileUrl,
            file_name: file.originalname,
            file_type: file.mimetype,
            file_size: file.size,
          });
        } catch (fileError) {
          console.error(
            `Error uploading file ${file.originalname}:`,
            fileError
          );
          // Continue with other files even if one fails
        }
      }

      if (uploadedResources.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload any files",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Files added successfully",
        data: {
          meeting_content_id: id,
          added_resources: uploadedResources,
          total_added: uploadedResources.length,
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

// Controller to delete a file from meeting content
exports.deleteFileFromMeetingContent = async (req, res) => {
  try {
    const { id, resourceId } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Content id is required",
      });
    }

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: "Resource id is required",
      });
    }

    // Verify meeting content exists
    const checkQuery = "SELECT * FROM meeting_content WHERE id = ?";
    const [meetingContent] = await db.promise().query(checkQuery, [id]);

    if (meetingContent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting content not found",
      });
    }

    // Check if user has permission (ownership check)
    const ownershipFilter = getOwnershipFilter(req, "administrator_id");
    if (ownershipFilter.whereClause) {
      const [userContent] = await db
        .promise()
        .query(
          `SELECT * FROM meeting_content ${ownershipFilter.whereClause} AND id = ? `,
          [...ownershipFilter.params, id]
        );
      if (userContent.length === 0) {
        return res.status(403).json({
          success: false,
          message:
            "You don't have permission to delete files from this meeting content",
        });
      }
    }

    // Delete the resource from database
    const deleteQuery =
      "DELETE FROM meeting_content_resource WHERE id = ? AND meeting_content_id = ?";
    const [result] = await db.promise().query(deleteQuery, [resourceId, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to delete a specific meeting content by ID
exports.deleteMeetingContentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Content id is required",
      });
    }

    const query = "DELETE FROM meeting_content WHERE id = ?";
    const [result] = await db.promise().query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting content not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Meeting content deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};
