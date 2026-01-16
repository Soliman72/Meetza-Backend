const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");
const { upload, uploadToCloudinaryResources } = require("../utils/uploadFile");
const { createNotification } = require("../services/notificationService");
const validator = require("validator");

// Controller to handle group content creation with file uploads
exports.createGroupContent = async (content_body, req) => {
  try {
    const { content_name, content_description, group_id } = content_body;
    const id = uuidv4();

    if (!content_name) {
      return {
        success: false,
        message: "Content name is required",
      };
    }

    // Check if the group exists
    const [groupRows] = await db
      .promise()
      .query("SELECT * FROM `group` WHERE id = ?", [group_id]);
    if (groupRows.length === 0) {
      return {
        success: false,
        message: "Group not found",
      };
    }

    // Insert the group content into the database
    const query =
      "INSERT INTO group_content (id, content_name, content_description, group_id) VALUES (?, ?, ?, ?)";
    await db
      .promise()
      .query(query, [id, content_name, content_description, group_id]);
    
    return {
      success: true,
      message: "Group content created successfully",
      data: {
        id,
        content_name,
        content_description,
        group_id,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: "Database error",
      error: err.message,
    };
  }
};

// Controller to get all group contents
exports.getAllGroupContents = async (req, res) => {
  try {
    const { name } = req.query;
    let query =
      "SELECT group_content.*, user.id AS administrator_id, user.name, user.email FROM group_content JOIN `group` ON group_content.group_id = `group`.id JOIN user ON `group`.administrator_id = user.id";
    let params = [];

    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(
      req,
      "`group`.administrator_id "
    );

    if (ownershipFilter.whereClause) {
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    if (ownershipFilter.whereClause && name) {
      query += " AND group_content.content_name LIKE ?";
      params.push(`%${name}%`);
    } else if (name) {
      query += " WHERE group_content.content_name LIKE ?";
      params.push(`%${name}%`);
    }

    const [results] = await db.promise().query(query, params);

    // Fetch resources for each group content
    const groupContentsWithResources = await Promise.all(
      results.map(async (groupContent) => {
        const resourcesQuery =
          "SELECT id, file_url, file_name, file_type, file_size, created_at FROM group_content_resource WHERE group_content_id = ? ORDER BY created_at ASC";
        const [resources] = await db
          .promise()
          .query(resourcesQuery, [groupContent.id]);

        return {
          ...groupContent,
          resources: resources,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: groupContentsWithResources,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to get a specific group content by ID
exports.getGroupContentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Content id is required",
      });
    }

    // Get group content
    const query = "SELECT * FROM group_content WHERE id = ?";
    const [results] = await db.promise().query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group content not found",
      });
    }

    // Get associated resources
    const resourcesQuery =
      "SELECT id, file_url, file_name, file_type, file_size, created_at FROM group_content_resource WHERE group_content_id = ? ORDER BY created_at ASC";
    const [resources] = await db.promise().query(resourcesQuery, [id]);

    const groupContent = {
      ...results[0],
      resources: resources,
    };

    return res.status(200).json({
      success: true,
      data: groupContent,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to update group content by ID
exports.updateGroupContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { content_name, content_description } = req.body;

    if (!id && !content_name && !content_description) {
      return res.status(400).json({
        success: false,
        message: "Content id, name or description is required",
      });
    }

    // Check if group content exists
    const checkQuery = "SELECT * FROM group_content WHERE id = ?";
    const [groupContent] = await db.promise().query(checkQuery, [id]);
    if (groupContent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group content not found",
      });
    }

    const query =
      "UPDATE group_content SET content_name = COALESCE(?, content_name), content_description = COALESCE(?, content_description) WHERE id = ?";
    const [result] = await db
      .promise()
      .query(query, [content_name, content_description, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Group content not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Group content updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to add files to an existing group content
exports.addFilesToGroupContent = (req, res) => {
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

      // Verify group content exists
      const checkQuery = "SELECT * FROM group_content WHERE id = ?";
      const [groupContent] = await db.promise().query(checkQuery, [id]);

      if (groupContent.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Group content not found",
        });
      }

      // Check if user has permission (ownership check)
      const ownershipFilter = getOwnershipFilter(
        req,
        "`group`.administrator_id"
      );
      if (ownershipFilter.whereClause) {
        const [userContent] = await db
          .promise()
          .query(
            `SELECT * FROM group_content JOIN \`group\` ON group_content.group_id = \`group\`.id ${ownershipFilter.whereClause} AND group_content.id = ? `,
            [...ownershipFilter.params, id]
          );
        if (userContent.length === 0) {
          return res.status(403).json({
            success: false,
            message:
              "You don't have permission to add files to this group content",
          });
        }
      }
      
      if ((!req.files || req.files.length === 0 ) && (!req.body.links || req.body.links.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "No files provided",
        });
      }

      const uploadedResources = [];
      
      if (req.files?.length > 0) {
        
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

            // Upload file to separate Cloudinary for group content resources (large files)
            const fileUrl = await uploadToCloudinaryResources(
              file,
              "group_content_resources",
              resourceType
            );

            // Generate resource ID
            const resourceId = uuidv4();

            // Insert resource into database
            const resourceQuery =
              "INSERT INTO group_content_resource (id, group_content_id, file_url, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)";
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
      }
      if (req.body.links?.length > 0) {
        // Handle link uploads
        const links = Array.isArray(req.body.links)
          ? req.body.links
          : [req.body.links];
        for (const link of links) {
          try {
            if (!validator.isURL(link, {
              require_protocol: true,
              protocols: ["http", "https"],
            })) {
              return res.status(400).json({
                success: false,
                message: "Invalid URL",
              });
            }
            if (link.startsWith("javascript:") || link.startsWith("data:")) {
              return res.status(400).json({
                success: false,
                message: "Unsafe URL detected",
              });
            }
            // Generate resource ID
            const resourceId = uuidv4();
            // Insert link as resource into database
            const resourceQuery =
              "INSERT INTO group_content_resource (id, group_content_id, file_url, file_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)";
            await db
              .promise()
              .query(resourceQuery, [
                resourceId,
                id,
                link,
                link,
                "link",
                0,
              ]);
            uploadedResources.push({
              id: resourceId,
              file_url: link,
              file_name: link,
              file_type: "link",
              file_size: 0,
            });


          } catch (linkError) {
            console.error(`Error adding link ${link}:`, linkError);
            // Continue with other links even if one fails
          }
        }
      }


      const group_id = groupContent[0].group_id;


      const [groupMemberships] = await db
        .promise()
        .query("SELECT member_id FROM group_membership WHERE group_id = ?", [
          group_id,
        ]);
      // Send Notification about new group content (optional) to each member
      // Using a loop to handle each notification separately
      const [groupRows] = await db
        .promise()
        .query(
          "SELECT group_name, administrator_id FROM `group` WHERE id = ?",
          [group_id]
        );
      const groupName =
        groupRows.length > 0 ? groupRows[0].group_name : "the group";
      const senderId =
        groupRows.length > 0 ? groupRows[0].administrator_id : null;

      for (const membership of groupMemberships) {
        await createNotification({
          memberId: membership.member_id,
          senderId: senderId,
          title: `${groupContent[0].content_name} has been updated in ${groupName}`,
          message: `The content "${groupContent[0].content_name}" has been updated in your group "${groupName}".`,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Files added successfully",
        data: {
          group_content_id: id,
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

// Controller to delete a file from group content
exports.deleteFileFromGroupContent = async (req, res) => {
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

    // Verify group content exists
    const checkQuery = "SELECT * FROM group_content WHERE id = ?";
    const [groupContent] = await db.promise().query(checkQuery, [id]);

    if (groupContent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group content not found",
      });
    }

    // Check if user has permission (ownership check)
    const ownershipFilter = getOwnershipFilter(req, "`group`.administrator_id");
    if (ownershipFilter.whereClause) {
      const [userContent] = await db
        .promise()
        .query(
          `SELECT * FROM group_content JOIN \`group\` ON group_content.group_id = \`group\`.\id ${ownershipFilter.whereClause} AND group_content.id = ? `,
          [...ownershipFilter.params, id]
        );
      if (userContent.length === 0) {
        return res.status(403).json({
          success: false,
          message:
            "You don't have permission to delete files from this group content",
        });
      }
    }

    // Delete the resource from database
    const deleteQuery =
      "DELETE FROM group_content_resource WHERE id = ? AND group_content_id = ?";
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
