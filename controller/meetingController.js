const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");
const { upload, uploadToCloudinary, uploadToCloudinaryResources } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");
const { createNotification } = require("../services/notificationService");

// Create a meeting (admin of the group only; no overlapping Scheduled meetings for same group)
exports.createMeeting = async (req, res) => {
  // Apply multer upload middleware to handle file uploads
  upload.fields([
    { name: "poster_file", maxCount: 1 },
    { name: "files", maxCount: 20 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    try {
      const { title, start_time, end_time, group_id, status, description } = req.body;
      const id = uuidv4();

      // Ensure poster file is uploaded
      if (!req.files && !req.body.poster_file) {
        return res.status(400).json({
          success: false,
          message: "Poster file is required",
        });
      }

      let posterUrl = "";
      if (req.files.poster_file) {
        const posterFile = req.files.poster_file[0];
        validateFileType(posterFile, "image");
        posterUrl = await uploadToCloudinary(posterFile, "posters");
      } else if (req.body.poster_file) {
        validateFileType(req.body.poster_file, "image");
        posterUrl = req.body.poster_file;
      }

      let files = [];
      if (req.files?.files?.length > 0) {
        // upload files to cloudinary
        for (const file of req.files.files) {
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

            // Get group content id from group id
            const [groupContent] = await db.promise().query("SELECT * FROM group_content WHERE group_id = ?", [group_id]);
            if (groupContent.length === 0) {
              return res.status(404).json({
                success: false,
                message: "Group content not found",
              });
            }
            // Insert resource into database
            const resourceQuery =
              "INSERT INTO group_content_resource (id, group_content_id, file_url, file_name, file_type, file_size, meeting_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
            await db
              .promise()
              .query(resourceQuery, [
                resourceId,
                groupContent[0].id,
                fileUrl,
                file.originalname,
                file.mimetype,
                file.size,
                id,
              ]);

            files.push({
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

        if (files.length === 0) {
          return res.status(500).json({
            success: false,
            message: "Failed to upload any files",
          });
        }
      }

      if (!title || !start_time || !end_time || !group_id || !status || !posterUrl) {
        return res.status(400).json({
          success: false,
          message:
            "Title, start_time, end_time, group_id, status, and posterUrl are required",
        });
      }

      if (
        status !== "Scheduled" &&
        status !== "Completed" &&
        status !== "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message: "Status must be one of: Scheduled, Completed, Cancelled",
        });
      }

      const start = new Date(start_time);
      const end = new Date(end_time);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "start_time and end_time must be valid dates",
        });
      }
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: "end_time must be after start_time",
        });
      }

      const [groupResults] = await db
        .promise()
        .query("SELECT * FROM `group` WHERE id = ?", [group_id]);
      if (groupResults.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid group_id: not found",
        });
      }

      const group = groupResults[0];
      const administrator_id = req.user?.id ?? req.administratorId;
      if (!administrator_id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: administrator_id is required",
        });
      }

      // Only the group's admin can create a meeting for this group (super admin cannot)
      if (group.administrator_id !== administrator_id) {
        // && !req.isSuperAdmin
        return res.status(403).json({
          success: false,
          message:
            "Only the administrator of this group can create meetings for it",
        });
      }

      // No overlapping Scheduled meetings for the same group at the same time
      const [overlap] = await db.promise().query(
        `SELECT id FROM meeting
        WHERE group_id = ? AND status = 'Scheduled'
        AND start_time < ? AND end_time > ?`,
        [group_id, end_time, start_time],
      );
      if (overlap.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "This group already has a Scheduled meeting at that time. Create meetings at a different time.",
        });
      }

      const query = `INSERT INTO meeting (id, title, start_time, end_time, status, administrator_id, group_id, poster_url, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      await db
        .promise()
        .query(query, [
          id,
          title,
          start_time,
          end_time,
          status,
          administrator_id,
          group_id,
          posterUrl,
          description,
        ]);

      // Notify all group members that a meeting has been scheduled (for their calendars)
      try {
        const [members] = await db
          .promise()
          .query("SELECT member_id FROM group_membership WHERE group_id = ?", [
            group_id,
          ]);

        const notificationTitle = "New meeting scheduled";
        const notificationMessage = `A new meeting \"${title}\" is scheduled from ${start_time} to ${end_time}.`;

        await Promise.all(
          members.map((m) =>
            createNotification({
              senderId: administrator_id,
              memberId: m.member_id,
              title: notificationTitle,
              message: notificationMessage,
            }),
          ),
        );
      } catch (notifyErr) {
        // Do not block meeting creation if notifications fail
        console.error("Failed to send meeting notifications:", notifyErr);
      }

      return res.status(201).json({
        success: true,
        message: "Meeting created successfully",
        data: {
          id,
          title,
          start_time,
          end_time,
          group_id,
          status,
          poster_url: posterUrl,
          description: description,
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

// Get all meetings
exports.getAllMeetings = async (req, res) => {
  try {
    const { title } = req.query;
    let query = "SELECT * FROM meeting";
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

// Get a meeting by id (admin of meeting or group member can view)
exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Meeting id is required",
      });
    }

    const [results] = await db
      .promise()
      .query("SELECT * FROM meeting WHERE id = ?", [id]);
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const meeting = results[0];
    const isSuperAdmin = req.user?.role === "Super_Admin";
    const isMeetingAdmin = meeting.administrator_id === userId;

    if (isSuperAdmin || isMeetingAdmin) {
      return res.status(200).json({ success: true, data: meeting });
    }

    const [membership] = await db
      .promise()
      .query(
        "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
        [meeting.group_id, userId],
      );
    if (membership.length > 0) {
      return res.status(200).json({ success: true, data: meeting });
    }

    return res.status(403).json({
      success: false,
      message: "You do not have access to this meeting",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Update a meeting by id (only the meeting's admin can update)
exports.updateMeetingById = async (req, res) => {
  upload.fields([
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
        const { title, start_time, end_time, group_id, status, description } = req.body;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: "Meeting id is required",
          });
        }

        const [existing] = await db
          .promise()
          .query("SELECT * FROM meeting WHERE id = ?", [id]);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Meeting not found",
          });
        }

        const meeting = existing[0];
        if (!req.isSuperAdmin && meeting.administrator_id !== req.administratorId) {
          return res.status(403).json({
            success: false,
            message: "Only the meeting administrator can update this meeting",
          });
        }

        const updates = [];
        const params = [];
        if (title != null) {
          updates.push("title = ?");
          params.push(title);
        }
        // Compute prospective start/end for validation
        const newStart =
          start_time != null ? new Date(start_time) : new Date(meeting.start_time);
        const newEnd =
          end_time != null ? new Date(end_time) : new Date(meeting.end_time);
        if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
          return res.status(400).json({
            success: false,
            message: "start_time and end_time must be valid dates",
          });
        }
        if (newStart >= newEnd) {
          return res.status(400).json({
            success: false,
            message: "end_time must be after start_time",
          });
        }
        if (start_time != null) {
          updates.push("start_time = ?");
          params.push(start_time);
        }
        if (end_time != null) {
          updates.push("end_time = ?");
          params.push(end_time);
        }
        if (status != null) {
          if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
            return res.status(400).json({
              success: false,
              message: "Status must be one of: Scheduled, Completed, Cancelled",
            });
          }
          updates.push("status = ?");
          params.push(status);
        }
        if (group_id != null) {
          updates.push("group_id = ?");
          params.push(group_id);
        }
        if (description != null) {
          updates.push("description = ?");
          params.push(description);
        }
        let posterUrl = "";
        if (req.files?.poster_file) {
          const posterFile = req.files.poster_file[0];
          validateFileType(posterFile, "image");
          posterUrl = await uploadToCloudinary(posterFile, "posters");
        } else if (req.body.poster_file) {
          validateFileType(req.body.poster_file, "image");
          posterUrl = req.body.poster_file;
        }
        if (posterUrl != null) {
          updates.push("poster_url = ?");
          params.push(posterUrl);
        }
        if (updates.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              "At least one field to update is required (title, start_time, end_time, status, group_id, description, poster_url)",
          });
        }

        // Enforce no overlap when start/end changed or status is Scheduled
        const effectiveStatus = status != null ? status : meeting.status;
        if (effectiveStatus === "Scheduled") {
          const [overlap] = await db.promise().query(
            `SELECT id FROM meeting
            WHERE group_id = ? AND status = 'Scheduled' AND id <> ?
            AND start_time < ? AND end_time > ?`,
            [group_id || meeting.group_id, id, newEnd, newStart],
          );
          if (overlap.length > 0) {
            return res.status(409).json({
              success: false,
              message:
                "This group already has a Scheduled meeting at that time. Choose a different time range.",
            });
          }
        }

        params.push(id);
        const query = `UPDATE meeting SET ${updates.join(", ")} WHERE id = ?`;
        await db.promise().query(query, [...params, id]);

        return res.status(200).json({
          success: true,
          message: "Meeting updated successfully",
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

// Delete a meeting by id (only the meeting's admin can delete)
exports.deleteMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Meeting id is required",
      });
    }

    const [existing] = await db
      .promise()
      .query("SELECT * FROM meeting WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const meeting = existing[0];
    if (!req.isSuperAdmin && meeting.administrator_id !== req.administratorId) {
      return res.status(403).json({
        success: false,
        message: "Only the meeting administrator can delete this meeting",
      });
    }

    await db.promise().query("DELETE FROM meeting WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// ---------- Member: join / leave meeting ----------

// Join a meeting (member of the group only; many members can join)
exports.joinMeeting = async (req, res) => {
  try {
    const { id: meetingId } = req.params;
    const userId = req.user?.id;
    if (!userId || !meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting id is required and user must be authenticated",
      });
    }

    const [meetingRows] = await db
      .promise()
      .query(
        "SELECT m.*, g.administrator_id AS group_admin_id FROM meeting m JOIN `group` g ON g.id = m.group_id WHERE m.id = ?",
        [meetingId],
      );
    if (meetingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }
    const meeting = meetingRows[0];

    const [membership] = await db
      .promise()
      .query(
        "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
        [meeting.group_id, userId],
      );
    if (membership.length === 0 && req.user.role == "Member") {
      return res.status(403).json({
        success: false,
        message: "Only members of this meeting's group can join the meeting",
      });
    } else if (req.user.role == "Administrator") {
      if (userId != meeting.administrator_id) {
        return res.status(403).json({
          success: false,
          message: "You are not the Administrator of this meeting!",
        });
      }
    }

    const [existing] = await db
      .promise()
      .query(
        "SELECT id FROM meeting_participant WHERE meeting_id = ? AND user_id = ?",
        [meetingId, userId],
      );
    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: "You are already in this meeting",
        data: { meeting_id: meetingId, userId },
      });
    }

    const participantId = uuidv4();
    await db
      .promise()
      .query(
        "INSERT INTO meeting_participant (id, meeting_id, user_id) VALUES (?, ?, ?)",
        [participantId, meetingId, userId],
      );

    return res.status(201).json({
      success: true,
      message: "Joined the meeting successfully",
      data: { id: participantId, meeting_id: meetingId, userId },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Leave a meeting (member removes themselves from the meeting)
exports.leaveMeeting = async (req, res) => {
  try {
    const { id: meetingId } = req.params;
    const userId = req.user?.id;
    if (!userId || !meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting id is required and user must be authenticated",
      });
    }

    const [result] = await db
      .promise()
      .query(
        "DELETE FROM meeting_participant WHERE meeting_id = ? AND user_id = ?",
        [meetingId, userId],
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "You were not in this meeting or the meeting does not exist",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Left the meeting successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Get participants of a meeting (admin of meeting or member of the group can list)
exports.getMeetingParticipants = async (req, res) => {
  try {
    const { id: meetingId } = req.params;
    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting id is required",
      });
    }

    const [meetingRows] = await db
      .promise()
      .query("SELECT * FROM meeting WHERE id = ?", [meetingId]);
    if (meetingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }
    const meeting = meetingRows[0];

    const userId = req.user?.id;
    const isMeetingAdmin = meeting.administrator_id === userId;
    const isSuperAdmin = req.user?.role === "Super_Admin";

    if (!isSuperAdmin && !isMeetingAdmin) {
      const [membership] = await db
        .promise()
        .query(
          "SELECT id FROM group_membership WHERE group_id = ? AND user_id = ?",
          [meeting.group_id, userId],
        );
      if (membership.length === 0) {
        return res.status(403).json({
          success: false,
          message:
            "Only the meeting administrator or group members can view participants",
        });
      }
    }

    const [rows] = await db.promise().query(
      `SELECT mp.id, mp.meeting_id, mp.user_id, mp.joined_at,
              u.name AS member_name, u.email AS member_email, u.user_photo AS member_photo
       FROM meeting_participant mp
       JOIN user u ON u.id = mp.user_id
       WHERE mp.meeting_id = ?
       ORDER BY mp.joined_at ASC`,
      [meetingId],
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Get meetings for a group (admin of group or member of group can list)
exports.getMeetingsByGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    if (!group_id) {
      return res.status(400).json({
        success: false,
        message: "group_id is required",
      });
    }

    const {
      ensureGroupAccess,
      GroupAccessError,
    } = require("../utils/groupAccess");
    try {
      await ensureGroupAccess(req.user.id, group_id);
    } catch (e) {
      if (e.name === "GroupAccessError") {
        return res.status(e.statusCode).json({
          success: false,
          message: e.message,
        });
      }
      throw e;
    }

    const [rows] = await db.promise().query(
      `SELECT m.*, u.name AS admin_name, u.email AS admin_email
       FROM meeting m
       JOIN user u ON u.id = m.administrator_id
       WHERE m.group_id = ?
       ORDER BY m.start_time DESC`,
      [group_id],
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};
