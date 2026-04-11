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
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT gc.*, u.id AS owner_id, u.name AS owner_name, u.email AS owner_email 
      FROM group_content gc 
      JOIN \`group\` g ON gc.group_id = g.id 
      JOIN group_admin ga ON ga.group_id = g.id AND ga.role = 'OWNER'
      JOIN user u ON ga.user_id = u.id
    `;
    let params = [];
    let whereClauses = [];

    // Apply access filter
    if (userRole === "Administrator") {
      query += " JOIN group_admin perm ON perm.group_id = g.id AND perm.user_id = ?";
      params.push(userId);
    } else if (userRole === "Member") {
      query += " JOIN group_membership gm ON gm.group_id = g.id AND gm.member_id = ?";
      params.push(userId);
    }
    // Super_Admin sees everything

    if (name) {
      whereClauses.push("gc.content_name LIKE ?");
      params.push(`%${name}%`);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    const [results] = await db.promise().query(query, params);

    if (results.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // N+1 Optimization: Bulk fetch resources
    const contentIds = results.map((c) => c.id);
    const [allResources] = await db.promise().query(
      "SELECT id, group_content_id, file_url, file_name, file_type, file_size, created_at FROM group_content_resource WHERE group_content_id IN (?) ORDER BY created_at ASC",
      [contentIds]
    );

    const resourcesByContentId = allResources.reduce((acc, res) => {
      if (!acc[res.group_content_id]) acc[res.group_content_id] = [];
      acc[res.group_content_id].push(res);
      return acc;
    }, {});

    const groupContentsWithResources = results.map((groupContent) => ({
      ...groupContent,
      resources: resourcesByContentId[groupContent.id] || [],
    }));

    return res.status(200).json({ success: true, data: groupContentsWithResources });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Controller to get a specific group content by ID
exports.getGroupContentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Content id is required" });
    }

    // Get group content with group_id for access check
    const query = "SELECT * FROM group_content WHERE id = ?";
    const [results] = await db.promise().query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group content not found",
      });
    }

    const groupContentRecord = results[0];
    const groupId = groupContentRecord.group_id;

    // Access check: User must be Super Admin, a Group Admin, or a Group Member
    if (req.user.role !== "Super_Admin") {
      const [hasAccess] = await db.promise().query(
        `
        SELECT 1 FROM (
          SELECT user_id FROM group_admin WHERE group_id = ? AND user_id = ?
          UNION
          SELECT member_id AS user_id FROM group_membership WHERE group_id = ? AND member_id = ?
        ) AS access LIMIT 1
        `,
        [groupId, req.user.id, groupId, req.user.id]
      );

      if (hasAccess.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this group's content",
        });
      }
    }

    // Get associated resources
    const resourcesQuery =
      "SELECT id, file_url, file_name, file_type, file_size, created_at FROM group_content_resource WHERE group_content_id = ? ORDER BY created_at ASC";
    const [resources] = await db.promise().query(resourcesQuery, [id]);

    const groupContent = {
      ...results[0],
      resources: resources,
    };

    return res.status(200).json({ success: true, data: groupContent });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Controller to update group content by ID
exports.updateGroupContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { content_name, content_description } = req.body;

    if (!id && !content_name && !content_description) {
      return res.status(400).json({ success: false, message: "Content id, name or description is required" });
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

    // Check permissions: only admins can update
    if (req.user.role !== "Super_Admin") {
      const [adminCheck] = await db.promise().query(
        "SELECT 1 FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
        [groupContent[0].group_id, req.user.id]
      );
      if (adminCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Only group administrators can update content",
        });
      }
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

    return res.status(200).json({ success: true, message: "Group content updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error", error: err.message });
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
      const { meeting_id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Content id is required",
        });
      }

      if (meeting_id) {
        const meetingCheckQuery = "SELECT * FROM meeting WHERE id = ?";
        const [meetingRows] = await db.promise().query(meetingCheckQuery, [meeting_id]);
        if (meetingRows.length === 0) {
          return res.status(404).json({ success: false, message: "Meeting not found" });
        }
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

      // Check if user has permission (administrator check)
      if (req.user.role !== "Super_Admin") {
        const [adminCheck] = await db.promise().query(
          "SELECT 1 FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
          [groupContent[0].group_id, req.user.id]
        );
        if (adminCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: "Only group administrators can add files to this content",
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
              "INSERT INTO group_content_resource (id, group_content_id, file_url, file_name, file_type, file_size, meeting_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
            await db
              .promise()
              .query(resourceQuery, [
                resourceId,
                id,
                fileUrl,
                file.originalname,
                file.mimetype,
                file.size,
                meeting_id,
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
              "INSERT INTO group_content_resource (id, group_content_id, file_url, file_name, file_type, file_size, meeting_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
            await db
              .promise()
              .query(resourceQuery, [
                resourceId,
                id,
                link,
                link,
                "link",
                0,
                meeting_id,
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
          "SELECT g.group_name, ga.user_id AS administrator_id FROM `group` g JOIN group_admin ga ON ga.group_id = g.id AND ga.role = 'OWNER' WHERE g.id = ?",
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
      return res.status(400).json({ success: false, message: "Content id is required" });
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

    // Check if user has permission (administrator check)
    if (req.user.role !== "Super_Admin") {
      const [adminCheck] = await db.promise().query(
        "SELECT 1 FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
        [groupContent[0].group_id, req.user.id]
      );
      if (adminCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Only group administrators can delete files from this content",
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

// Get group content resources by meeting id
exports.getGroupContentResourcesByMeetingId = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    if (!meeting_id) {
      return res.status(400).json({
        success: false,
        message: "Meeting id is required",
      });
    }
    const query = "SELECT * FROM group_content_resource WHERE meeting_id = ?";
    const [resources] = await db.promise().query(query, [meeting_id]);
    return res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};