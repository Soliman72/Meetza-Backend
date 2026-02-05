const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");
const { upload, uploadToCloudinary } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");
const { createNotification } = require("../services/notificationService");

// Create a meeting (admin of the group only; no overlapping Scheduled meetings for same group)
exports.createMeeting = async (req, res) => {
  try {
    const { title, datetime, group_id, status, duration_minutes } = req.body;
    const id = uuidv4();

    if (!title || !datetime || !group_id || !status) {
      return res.status(400).json({
        success: false,
        message: "Title, datetime, group_id, and status are required",
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

    // Only the group's admin can create a meeting for this group
    if (group.administrator_id !== administrator_id && !req.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Only the administrator of this group can create meetings for it",
      });
    }

    const duration =
      duration_minutes != null ? parseInt(duration_minutes, 10) : 60;
    if (isNaN(duration) || duration < 1) {
      return res.status(400).json({
        success: false,
        message: "duration_minutes must be a positive number",
      });
    }

    // No overlapping Scheduled meetings for the same group at the same time
    const [overlap] = await db.promise().query(
      `SELECT id FROM meeting
       WHERE group_id = ? AND status = 'Scheduled'
       AND datetime < DATE_ADD(?, INTERVAL ? MINUTE)
       AND DATE_ADD(datetime, INTERVAL COALESCE(duration_minutes, 60) MINUTE) > ?`,
      [group_id, datetime, duration, datetime]
    );
    if (overlap.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This group already has a Scheduled meeting at that time. Create meetings at a different time.",
      });
    }

    const query = `INSERT INTO meeting (id, title, datetime, duration_minutes, status, administrator_id, group_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await db
      .promise()
      .query(query, [
        id,
        title,
        datetime,
        duration,
        status,
        administrator_id,
        group_id,
      ]);

    // Notify all group members that a meeting has been scheduled (for their calendars)
    try {
      const [members] = await db
        .promise()
        .query("SELECT member_id FROM group_membership WHERE group_id = ?", [
          group_id,
        ]);

      const notificationTitle = "New meeting scheduled";
      const notificationMessage = `A new meeting \"${title}\" is scheduled for ${datetime}.`;

      await Promise.all(
        members.map((m) =>
          createNotification({
            senderId: administrator_id,
            memberId: m.member_id,
            title: notificationTitle,
            message: notificationMessage,
          })
        )
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
        datetime,
        duration_minutes: duration,
        group_id,
        status,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
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
        [meeting.group_id, userId]
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
  try {
    const { id } = req.params;
    const { title, datetime, group_id, status, duration_minutes } = req.body;

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
    if (datetime != null) {
      updates.push("datetime = ?");
      params.push(datetime);
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
    if (duration_minutes != null) {
      updates.push("duration_minutes = ?");
      params.push(parseInt(duration_minutes, 10));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field to update is required (title, datetime, status, group_id, duration_minutes)",
      });
    }

    params.push(id);
    const query = `UPDATE meeting SET ${updates.join(", ")} WHERE id = ?`;
    await db.promise().query(query, params);

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
        [meetingId]
      );
    if (meetingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }
    const meeting = meetingRows[0];

    const [memberRows] = await db
      .promise()
      .query("SELECT user_id FROM member WHERE user_id = ?", [userId]);
    if (memberRows.length === 0) {
      return res.status(403).json({
        success: false,
        message:
          "Only members can join meetings. You are not registered as a member.",
      });
    }
    const member_id = memberRows[0].user_id;

    const [membership] = await db
      .promise()
      .query(
        "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
        [meeting.group_id, member_id]
      );
    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Only members of this meeting's group can join the meeting",
      });
    }

    const [existing] = await db
      .promise()
      .query(
        "SELECT id FROM meeting_participant WHERE meeting_id = ? AND member_id = ?",
        [meetingId, member_id]
      );
    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: "You are already in this meeting",
        data: { meeting_id: meetingId, member_id },
      });
    }

    const participantId = uuidv4();
    await db
      .promise()
      .query(
        "INSERT INTO meeting_participant (id, meeting_id, member_id) VALUES (?, ?, ?)",
        [participantId, meetingId, member_id]
      );

    return res.status(201).json({
      success: true,
      message: "Joined the meeting successfully",
      data: { id: participantId, meeting_id: meetingId, member_id },
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

    const [memberRows] = await db
      .promise()
      .query("SELECT user_id FROM member WHERE user_id = ?", [userId]);
    if (memberRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Only members can leave meetings",
      });
    }
    const member_id = memberRows[0].user_id;

    const [result] = await db
      .promise()
      .query(
        "DELETE FROM meeting_participant WHERE meeting_id = ? AND member_id = ?",
        [meetingId, member_id]
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
          "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
          [meeting.group_id, userId]
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
      `SELECT mp.id, mp.meeting_id, mp.member_id, mp.joined_at,
              u.name AS member_name, u.email AS member_email, u.user_photo AS member_photo
       FROM meeting_participant mp
       JOIN user u ON u.id = mp.member_id
       WHERE mp.meeting_id = ?
       ORDER BY mp.joined_at ASC`,
      [meetingId]
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
       ORDER BY m.datetime DESC`,
      [group_id]
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

// Save meeting recording as a video (admin only; upload recorded file from client)
exports.saveMeetingRecording = (req, res) => {
  upload.fields([
    { name: "video_file", maxCount: 1 },
    { name: "poster_file", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    try {
      const { id: meetingId } = req.params;
      const { title, description } = req.body;
      if (!meetingId) {
        return res.status(400).json({
          success: false,
          message: "Meeting id is required",
        });
      }
      const videoFile = req.files?.video_file?.[0];
      if (!videoFile) {
        return res.status(400).json({
          success: false,
          message: "video_file is required (recorded meeting video)",
        });
      }

      const [meetingRows] = await db
        .promise()
        .query("SELECT * FROM meeting WHERE id = ?", [meetingId]);
      if (meetingRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }
      const meeting = meetingRows[0];
      const userId = req.user?.id ?? req.administratorId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      if (
        meeting.administrator_id !== userId &&
        req.user?.role !== "Super_Admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Only the meeting administrator can save the recording",
        });
      }

      // Auto-generate title if not provided (automatic save/upload to the meeting's group)
      const dateRecorded = new Date().toISOString().split("T")[0];
      const timePart = new Date().toTimeString().slice(0, 5);
      const finalTitle =
        title && typeof title === "string" && title.trim()
          ? title.trim()
          : `Recording: ${
              meeting.title || "Meeting"
            } - ${dateRecorded} ${timePart}`;

      validateFileType(videoFile, "video");
      let videoUrl = await uploadToCloudinary(videoFile, "videos");
      let posterUrl = null;
      const posterFile = req.files?.poster_file?.[0];
      if (posterFile) {
        validateFileType(posterFile, "image");
        posterUrl = await uploadToCloudinary(posterFile, "posters");
      }

      const videoId = uuidv4();
      await db.promise().query(
        `INSERT INTO video (id, title, meeting_id, video_url, poster_url, administrator_id, date_recorded, description, group_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          videoId,
          finalTitle,
          meetingId,
          videoUrl,
          posterUrl,
          userId,
          dateRecorded,
          description && typeof description === "string"
            ? description.trim()
            : null,
          meeting.group_id,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Meeting recording saved and uploaded to the meeting's group",
        data: {
          id: videoId,
          title: finalTitle,
          meeting_id: meetingId,
          video_url: videoUrl,
          poster_url: posterUrl,
          date_recorded: dateRecorded,
          description:
            description && typeof description === "string"
              ? description.trim()
              : null,
          group_id: meeting.group_id,
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
