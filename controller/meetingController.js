const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const {
  upload,
  uploadToCloudinary,
  uploadToCloudinaryResources,
} = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");
const { createNotification } = require("../services/notificationService");
const {
  activateWeeklySeries,
  deactivateSeriesInDb,
  reactivateSeriesInDb,
} = require("../services/meetingRecurrenceScheduler");
const {
  isGroupAdmin,
  isMeetingAdmin,
  assignMeetingAdmin,
} = require("../utils/resourceAdminAccess");

async function attachAdminsToMeetings(meetings) {
  if (!Array.isArray(meetings) || meetings.length === 0) return meetings;
  const groupIds = [...new Set(meetings.map((m) => m.group_id).filter(Boolean))];
  if (groupIds.length === 0) {
    return meetings.map((meeting) => ({ ...meeting, admins: [] }));
  }
  const placeholders = groupIds.map(() => "?").join(",");
  const [admins] = await db.promise().query(
    `SELECT ga.group_id, ga.user_id, ga.role, ga.assigned_by, ga.created_at,
            u.name, u.email, u.user_photo
     FROM group_admin ga
     JOIN user u ON u.id = ga.user_id
     WHERE ga.group_id IN (${placeholders})
     ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC`,
    groupIds,
  );
  const adminsByGroup = admins.reduce((acc, row) => {
    if (!acc[row.group_id]) acc[row.group_id] = [];
    acc[row.group_id].push(row);
    return acc;
  }, {});
  return meetings.map((meeting) => ({
    ...meeting,
    admins: adminsByGroup[meeting.group_id] || [],
  }));
}

function parseWeeklyFlag(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return false;
  }
  const s = String(raw).toLowerCase();
  return s === "true" || s === "1";
}

// Create a meeting (admin of the group only; no overlapping Scheduled meetings for same group)
exports.createMeeting = async (req, res) => {
  // Apply multer upload middleware to handle file uploads
  upload.fields([
    { name: "poster_file", maxCount: 1 },
    { name: "files", maxCount: 20 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    try {
      const {
        title,
        start_time,
        end_time,
        group_id,
        status,
        description,
        recording,
        weekly,
      } = req.body;
      const id = uuidv4();
      const isWeekly = parseWeeklyFlag(weekly);

      // Ensure poster file is uploaded
      if (!req.files && !req.body.poster_file) {
        return res
          .status(400)
          .json({ success: false, message: "Poster file is required" });
      }

      if (
        !title ||
        !start_time ||
        !end_time ||
        !group_id ||
        !status ||
        !recording
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title, start_time, end_time, group_id, status, and recording are required",
        });
      }
      if (recording !== "1" && recording !== "0") {
        return res
          .status(400)
          .json({ success: false, message: "Recording must be 1 or 0" });
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
      if (isWeekly && status !== "Scheduled") {
        return res.status(400).json({
          success: false,
          message: "Weekly meetings must be created with status Scheduled",
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
      const now = new Date();
      if (start < now || end < now) {
        return res.status(400).json({
          success: false,
          message: "start_time and end_time must not be in the past",
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
        return res
          .status(400)
          .json({ success: false, message: "Invalid group_id: not found" });
      }

      const group = groupResults[0];
      const administrator_id = req.user?.id ?? req.administratorId;
      if (!administrator_id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: administrator_id is required",
        });
      }

      if (
        !req.isSuperAdmin &&
        !(await isGroupAdmin(administrator_id, group_id))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only group admins and super admin can create meetings for it",
        });
      }

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

      let posterUrl = "";
      let files = [];

      if (req.files.poster_file) {
        const posterFile = req.files.poster_file[0];
        validateFileType(posterFile, "image");
        posterUrl = await uploadToCloudinary(posterFile, "posters");
      } else if (req.body.poster_file) {
        validateFileType(req.body.poster_file, "image");
        posterUrl = req.body.poster_file;
      }

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
              resourceType,
            );

            // Generate resource ID
            const resourceId = uuidv4();

            // Get group content id from group id
            const [groupContent] = await db
              .promise()
              .query("SELECT * FROM group_content WHERE group_id = ?", [
                group_id,
              ]);
            if (groupContent.length === 0) {
              return res
                .status(404)
                .json({ success: false, message: "Group content not found" });
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
              fileError,
            );
            // Continue with other files even if one fails
          }
        }

        if (files.length === 0) {
          return res
            .status(500)
            .json({ success: false, message: "Failed to upload any files" });
        }
      }
      const seriesId = isWeekly ? uuidv4() : null;
      const query = `INSERT INTO meeting (id, title, start_time, end_time, status, administrator_id, group_id, poster_url, description, recording, is_weekly, series_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      await db
        .promise()
        .query(query, [
          id,
          title,
          start_time,
          end_time,
          status,
          group.administrator_id,
          group_id,
          posterUrl,
          description,
          recording,
          isWeekly ? 1 : 0,
          seriesId,
        ]);

      const [groupAdmins] = await db
        .promise()
        .query(
          "SELECT user_id, role FROM group_admin WHERE group_id = ?",
          [group_id],
        );
      await Promise.all(
        groupAdmins.map((admin) =>
          assignMeetingAdmin({
            meetingId: id,
            userId: admin.user_id,
            role: admin.role || "ADMIN",
            assignedBy: req.user.id,
          }),
        ),
      );

      if (isWeekly) {
        const durationMs = end.getTime() - start.getTime();
        try {
          await activateWeeklySeries({
            seriesId,
            groupId: group_id,
            administratorId: group.administrator_id,
            originalMeetingId: id,
            templateTitle: title,
            templatePosterUrl: posterUrl,
            templateDescription: description,
            templateRecording: recording,
            durationMs,
            startDate: start,
          });
        } catch (recErr) {
          await db.promise().query("DELETE FROM meeting WHERE id = ?", [id]);
          console.error("Weekly series activation failed:", recErr);
          return res.status(500).json({
            success: false,
            message:
              "Meeting was not created: failed to activate weekly schedule",
            error: recErr.message,
          });
        }
      }

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
          recording: recording,
          weekly: isWeekly,
          series_id: seriesId,
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

// Get all meetings if user is member of the group or super admin can view all meetings or admin of the meeting.
// Optional query: title (search), group_id (filter by group; user must be admin or member of the group).
// Build date filter clause and params for getAllMeetings. Returns { clause, params } or null.
// Priority: start_date+end_date > day > week > month.
function getDateFilterForMeetings(query) {
  const { start_date, end_date, day, week, month } = query;
  const hasRange =
    start_date != null &&
    start_date !== "" &&
    end_date != null &&
    end_date !== "";
  if (hasRange) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        error: "start_date and end_date must be valid dates (YYYY-MM-DD)",
      };
    }
    if (start > end) {
      return { error: "start_date must be before or equal to end_date" };
    }
    return {
      clause: "DATE(start_time) >= ? AND DATE(start_time) <= ?",
      params: [start_date, end_date],
    };
  }
  if (day != null && day !== "") {
    const d = new Date(day);
    if (Number.isNaN(d.getTime())) {
      return { error: "day must be a valid date (YYYY-MM-DD)" };
    }
    const dayStr = d.toISOString().slice(0, 10);
    return { clause: "DATE(start_time) = ?", params: [dayStr] };
  }
  if (week != null && week !== "") {
    const w = new Date(week);
    if (Number.isNaN(w.getTime())) {
      return { error: "week must be a valid date (YYYY-MM-DD)" };
    }
    const weekStr = w.toISOString().slice(0, 10);
    return {
      clause: "YEARWEEK(start_time, 1) = YEARWEEK(?, 1)",
      params: [weekStr],
    };
  }
  if (month != null && month !== "") {
    const match = String(month).match(/^(\d{4})-(\d{1,2})$/);
    if (!match) {
      return { error: "month must be YYYY-MM (e.g. 2025-03)" };
    }
    const [, y, m] = match;
    const monthNum = parseInt(m, 10);
    if (monthNum < 1 || monthNum > 12) {
      return { error: "month must be between 01 and 12" };
    }
    return {
      clause: "YEAR(start_time) = ? AND MONTH(start_time) = ?",
      params: [y, monthNum],
    };
  }
  return null;
}

exports.getAllMeetings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, group_id } = req.query;

    // Date filter: day | week | month | start_date + end_date
    const dateFilter = getDateFilterForMeetings(req.query);
    if (dateFilter?.error) {
      return res
        .status(400)
        .json({ success: false, message: dateFilter.error });
    }

    // When group_id filter is used, ensure user has access to that group (admin or member)
    if (group_id) {
      const {
        ensureGroupAccess,
        GroupAccessError,
      } = require("../utils/groupAccess");
      try {
        await ensureGroupAccess(userId, group_id);
      } catch (e) {
        if (e.name === "GroupAccessError") {
          return res
            .status(e.statusCode)
            .json({ success: false, message: e.message });
        }
        throw e;
      }
    }

    const ownershipFilter =
      req.user.role === "Super_Admin"
        ? { whereClause: "", params: [] }
        : {
            whereClause:
              "WHERE EXISTS (SELECT 1 FROM group_admin ga WHERE ga.group_id = meeting.group_id AND ga.user_id = ?)",
            params: [userId],
          };
    let query = "SELECT * FROM meeting";
    let params = [];
    const conditions = [];
    if (ownershipFilter.whereClause) {
      conditions.push(ownershipFilter.whereClause.replace(/^WHERE\s+/i, ""));
      params.push(...ownershipFilter.params);
    }
    if (title) {
      conditions.push("title LIKE ?");
      params.push(`%${title}%`);
    }
    if (group_id) {
      conditions.push("group_id = ?");
      params.push(group_id);
    }
    if (dateFilter) {
      conditions.push(dateFilter.clause);
      params.push(...dateFilter.params);
    }
    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY start_time DESC";

    if (req.user.role === "Member") {
      // Get all meetings for the user's groups (optionally filtered by group_id, title, and date)
      let memberQuery =
        "SELECT * FROM meeting WHERE group_id IN (SELECT group_id FROM group_membership WHERE member_id = ?)";
      const memberParams = [userId];
      if (group_id) {
        memberQuery += " AND group_id = ?";
        memberParams.push(group_id);
      }
      if (title) {
        memberQuery += " AND title LIKE ?";
        memberParams.push(`%${title}%`);
      }
      if (dateFilter) {
        memberQuery += " AND " + dateFilter.clause;
        memberParams.push(...dateFilter.params);
      }
      memberQuery += " ORDER BY start_time DESC";
      const [meetings] = await db.promise().query(memberQuery, memberParams);
      const meetingsWithAdmins = await attachAdminsToMeetings(meetings);
      return res.status(200).json({ success: true, data: meetingsWithAdmins });
    }
    if (req.user.role === "Super_Admin" || req.user.role === "Administrator") {
      const [meetings] = await db.promise().query(query, params);
      const meetingsWithAdmins = await attachAdminsToMeetings(meetings);
      return res.status(200).json({ success: true, data: meetingsWithAdmins });
    }

    return res.status(403).json({ success: false, message: "Access denied" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Get a meeting by id (admin of meeting or group member can view)
exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Meeting id is required" });
    }

    const [results] = await db
      .promise()
      .query("SELECT * FROM meeting WHERE id = ?", [id]);
    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    const meeting = results[0];
    const isSuperAdmin = req.user?.role === "Super_Admin";
    const isMeetingAdminUser = await isMeetingAdmin(userId, id);

    if (isSuperAdmin || isMeetingAdminUser) {
      const meetingsWithAdmins = await attachAdminsToMeetings([meeting]);
      return res.status(200).json({ success: true, data: meetingsWithAdmins[0] });
    }

    const [membership] = await db
      .promise()
      .query(
        "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
        [meeting.group_id, userId],
      );
    if (membership.length > 0) {
      const meetingsWithAdmins = await attachAdminsToMeetings([meeting]);
      return res.status(200).json({ success: true, data: meetingsWithAdmins[0] });
    }

    return res.status(403).json({
      success: false,
      message: "You do not have access to this meeting",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Update a meeting by id (only the meeting's admin can update)
exports.updateMeetingById = async (req, res) => {
  upload.fields([{ name: "poster_file", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      try {
        const { id } = req.params;
        const {
          title,
          start_time,
          end_time,
          group_id,
          status,
          description,
          recording,
          weekly,
        } = req.body;
        if (req.body.recording && recording !== "1" && recording !== "0") {
          return res
            .status(400)
            .json({ success: false, message: "Recording must be 1 or 0" });
        }

        if (!id) {
          return res
            .status(400)
            .json({ success: false, message: "Meeting id is required" });
        }

        const [existing] = await db
          .promise()
          .query("SELECT * FROM meeting WHERE id = ?", [id]);
        if (existing.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Meeting not found" });
        }

        const meeting = existing[0];
        const canUpdate =
          req.user.role === "Super_Admin" ||
          (req.user.role === "Administrator" &&
            (await isMeetingAdmin(req.user.id, id)));
        if (!canUpdate) {
          return res.status(403).json({
            success: false,
            message: "Only meeting admins can update this meeting",
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
          start_time != null
            ? new Date(start_time)
            : new Date(meeting.start_time);
        const newEnd =
          end_time != null ? new Date(end_time) : new Date(meeting.end_time);
        if (
          Number.isNaN(newStart.getTime()) ||
          Number.isNaN(newEnd.getTime())
        ) {
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
        if (recording != null) {
          updates.push("recording = ?");
          params.push(recording);
        }
        const originalSeriesId = meeting.series_id;
        let isWeeklyChanged = false;
        let isWeeklyNewVal = false;
        if (weekly !== undefined && weekly !== null) {
          isWeeklyNewVal = parseWeeklyFlag(weekly);
          if (isWeeklyNewVal !== Boolean(meeting.is_weekly)) {
            isWeeklyChanged = true;
            updates.push("is_weekly = ?");
            params.push(isWeeklyNewVal ? 1 : 0);

            if (isWeeklyNewVal && !originalSeriesId) {
              meeting.series_id = uuidv4();
              updates.push("series_id = ?");
              params.push(meeting.series_id);
            }
          }
        }

        if (updates.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              "At least one field to update is required (title, start_time, end_time, status, group_id, description, poster_url, recording, weekly)",
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

        if (isWeeklyChanged) {
          try {
            if (isWeeklyNewVal) {
              if (!originalSeriesId) {
                const durationMs = newEnd.getTime() - newStart.getTime();
                await activateWeeklySeries({
                  seriesId: meeting.series_id,
                  groupId: group_id || meeting.group_id,
                  administratorId: meeting.administrator_id,
                  originalMeetingId: id,
                  templateTitle: title ?? meeting.title,
                  templatePosterUrl: posterUrl ?? meeting.poster_url,
                  templateDescription: description ?? meeting.description,
                  templateRecording: recording ?? meeting.recording,
                  durationMs,
                  startDate: newStart,
                });
              } else {
                await reactivateSeriesInDb(meeting.series_id);
              }
            } else {
              if (originalSeriesId) {
                await deactivateSeriesInDb(originalSeriesId);
              }
            }
          } catch (recErr) {
            console.error("Failed to toggle recurrence during update:", recErr);
          }
        }

        // Keep series template in sync so recurrence does not depend on any single meeting row
        try {
          const effectiveSeriesId = meeting.series_id;
          const didTemplateChange =
            title != null ||
            description != null ||
            posterUrl != null ||
            recording != null;
          const shouldSyncTemplate =
            effectiveSeriesId &&
            (isWeeklyNewVal || meeting.is_weekly) &&
            didTemplateChange;
          if (shouldSyncTemplate) {
            const sets = [];
            const sParams = [];
            if (title != null) {
              sets.push("template_title = ?");
              sParams.push(title);
            }
            if (posterUrl != null) {
              sets.push("template_poster_url = ?");
              sParams.push(posterUrl);
            }
            if (description != null) {
              sets.push("template_description = ?");
              sParams.push(description);
            }
            if (recording != null) {
              sets.push("template_recording = ?");
              sParams.push(recording);
            }
            if (sets.length > 0) {
              sParams.push(effectiveSeriesId);
              await db
                .promise()
                .query(
                  `UPDATE meeting_series SET ${sets.join(", ")} WHERE id = ?`,
                  sParams,
                );
            }
          }
        } catch (e) {
          console.error("Failed to sync meeting_series template:", e);
        }

        // Notify all group members that a meeting has been updated
        try {
          const effectiveGroupId = group_id || meeting.group_id;
          const effectiveTitle = title ?? meeting.title;
          const effectiveStart = start_time ?? meeting.start_time;
          const effectiveEnd = end_time ?? meeting.end_time;

          const [members] = await db
            .promise()
            .query(
              "SELECT member_id FROM group_membership WHERE group_id = ?",
              [effectiveGroupId],
            );

          const notificationTitle = "Meeting updated";
          const notificationMessage = `The meeting "${effectiveTitle}" has been updated. New schedule: ${effectiveStart} to ${effectiveEnd}.`;

          await Promise.all(
            members.map((m) =>
              createNotification({
                senderId: meeting.administrator_id,
                memberId: m.member_id,
                title: notificationTitle,
                message: notificationMessage,
              }),
            ),
          );
        } catch (notifyErr) {
          // Do not block meeting update if notifications fail
          console.error(
            "Failed to send meeting update notifications:",
            notifyErr,
          );
        }

        return res
          .status(200)
          .json({ success: true, message: "Meeting updated successfully" });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }
    },
  );
};

// Stop future weekly occurrences for a meeting's series.
exports.deactivateMeetingRecurrence = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Meeting ID is required" });
    }

    const [meetingRows] = await db
      .promise()
      .query("SELECT * FROM meeting WHERE id = ?", [id]);
    if (meetingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    const meeting = meetingRows[0];
    if (!req.isSuperAdmin && !(await isMeetingAdmin(req.user?.id, id))) {
      return res.status(403).json({
        success: false,
        message:
          "Only the meeting administrator or a super admin can stop recurrence",
      });
    }

    const seriesId = meeting.series_id;
    if (!seriesId) {
      return res.status(400).json({
        success: false,
        message: "Meeting is not part of a recurrence series",
      });
    }

    const [seriesRows] = await db
      .promise()
      .query("SELECT * FROM meeting_series WHERE id = ?", [seriesId]);
    if (seriesRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting series not found" });
    }

    await deactivateSeriesInDb(seriesId);
    return res.status(200).json({
      success: true,
      message: "Weekly recurrence stopped for this meeting's series.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Activate recurrence for a specific meeting or a series
exports.activateMeetingRecurrence = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required" });
    }

    // Try to find as a meeting ID
    const [meetingRows] = await db
      .promise()
      .query("SELECT * FROM meeting WHERE id = ?", [id]);

    if (meetingRows.length > 0) {
      const meeting = meetingRows[0];

      // Check permissions
      if (!req.isSuperAdmin && !(await isMeetingAdmin(req.user?.id, id))) {
        return res.status(403).json({
          success: false,
          message:
            "Only the meeting administrator or a super admin can activate recurrence",
        });
      }

      let seriesId = meeting.series_id;

      if (!seriesId) {
        const { v4: uuidv4 } = require("uuid");
        seriesId = uuidv4();
        // Update meeting to link to the new series and set is_weekly
        await db
          .promise()
          .query(
            "UPDATE meeting SET is_weekly = 1, series_id = ? WHERE id = ?",
            [seriesId, id],
          );
      } else {
        await db
          .promise()
          .query("UPDATE meeting SET is_weekly = 1 WHERE id = ?", [id]);
      }

      const [seriesRows] = await db
        .promise()
        .query("SELECT * FROM meeting_series WHERE id = ?", [seriesId]);

      if (seriesRows.length === 0) {
        // Need to create it
        const start = new Date(meeting.start_time);
        const end = new Date(meeting.end_time);
        const durationMs = end.getTime() - start.getTime();

        try {
          await activateWeeklySeries({
            seriesId,
            groupId: meeting.group_id,
            administratorId: meeting.administrator_id,
            originalMeetingId: id,
            templateTitle: meeting.title,
            templatePosterUrl: meeting.poster_url,
            templateDescription: meeting.description,
            templateRecording: meeting.recording,
            durationMs,
            startDate: start,
          });
        } catch (recErr) {
          console.error("Weekly series activation failed:", recErr);
          return res.status(500).json({
            success: false,
            message: "Failed to activate weekly schedule",
            error: recErr.message,
          });
        }
      } else {
        // Reactivate existing
        await reactivateSeriesInDb(seriesId);
      }

      return res.status(200).json({
        success: true,
        message: "Weekly recurrence activated successfully.",
        data: { series_id: seriesId },
      });
    } else {
      // Try to find as a series ID
      const [seriesRowsCheck] = await db
        .promise()
        .query("SELECT * FROM meeting_series WHERE id = ?", [id]);
      if (seriesRowsCheck.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Meeting or Series not found" });
      }

      const sr = seriesRowsCheck[0];
      if (
        !req.isSuperAdmin &&
        !(await isMeetingAdmin(req.user?.id, sr.original_meeting_id || id))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the series administrator or a super admin can start recurrence",
        });
      }

      await reactivateSeriesInDb(id);
      return res.status(200).json({
        success: true,
        message: "Weekly recurrence started for this series.",
      });
    }
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
    const scopeRaw = req.query?.scope;
    const scope =
      scopeRaw && String(scopeRaw).toLowerCase() === "series"
        ? "series"
        : "single";
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Meeting id is required" });
    }

    const [existing] = await db
      .promise()
      .query("SELECT * FROM meeting WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    const meeting = existing[0];
    if (!req.isSuperAdmin && !(await isMeetingAdmin(req.user?.id, id))) {
      return res.status(403).json({
        success: false,
        message: "Only the meeting administrator can delete this meeting",
      });
    }

    if (scope === "series" && meeting.series_id) {
      const seriesId = meeting.series_id;
      await deactivateSeriesInDb(seriesId);
      await db
        .promise()
        .query("DELETE FROM meeting WHERE series_id = ?", [seriesId]);
      await db
        .promise()
        .query("DELETE FROM meeting_series WHERE id = ?", [seriesId]);
    } else {
      await db.promise().query("DELETE FROM meeting WHERE id = ?", [id]);
    }

    // Notify all group members that a meeting has been deleted
    try {
      const [members] = await db
        .promise()
        .query("SELECT member_id FROM group_membership WHERE group_id = ?", [
          meeting.group_id,
        ]);

      const notificationTitle =
        scope === "series" && meeting.series_id
          ? "Meeting series deleted"
          : "Meeting deleted";
      const notificationMessage =
        scope === "series" && meeting.series_id
          ? `The weekly meeting series "${meeting.title}" has been deleted forever.`
          : `The meeting "${meeting.title}" scheduled for ${meeting.start_time} has been deleted.`;

      await Promise.all(
        members.map((m) =>
          createNotification({
            senderId: meeting.administrator_id,
            memberId: m.member_id,
            title: notificationTitle,
            message: notificationMessage,
          }),
        ),
      );
    } catch (notifyErr) {
      console.error(
        "Failed to send meeting deletion notifications:",
        notifyErr,
      );
    }

    return res.status(200).json({
      success: true,
      message:
        scope === "series" && meeting.series_id
          ? "Meeting series deleted successfully"
          : "Meeting deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
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
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
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

    return res
      .status(200)
      .json({ success: true, message: "Left the meeting successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Get participants of a meeting (admin of meeting or member of the group can list)
exports.getMeetingParticipants = async (req, res) => {
  try {
    const { id: meetingId } = req.params;
    if (!meetingId) {
      return res
        .status(400)
        .json({ success: false, message: "Meeting id is required" });
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
    const isMeetingAdminUser = await isMeetingAdmin(userId, meetingId);
    const isSuperAdmin = req.user?.role === "Super_Admin";

    if (!isSuperAdmin && !isMeetingAdminUser) {
      const [membership] = await db
        .promise()
        .query(
          "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
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

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

exports.getMeetingAdmins = async (req, res) => {
  try {
    const { id: meetingId } = req.params;
    const [meetingRows] = await db
      .promise()
      .query("SELECT group_id FROM meeting WHERE id = ?", [meetingId]);
    if (meetingRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }
    if (
      !req.isSuperAdmin &&
      !(await isMeetingAdmin(req.user.id, meetingId)) &&
      !(await isGroupAdmin(req.user.id, meetingRows[0].group_id))
    ) {
      return res.status(403).json({
        success: false,
        message: "Only meeting/group admins can view meeting admins",
      });
    }
    const [rows] = await db.promise().query(
      `SELECT ga.id, ? AS meeting_id, ga.user_id, ga.role, ga.assigned_by, ga.created_at,
              u.name, u.email, u.user_photo
       FROM group_admin ga
       JOIN user u ON u.id = ga.user_id
       WHERE ga.group_id = ?
       ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC`,
      [meetingId, meetingRows[0].group_id],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

exports.addMeetingAdmin = async (req, res) => {
  return res.status(410).json({
    success: false,
    message:
      "Manual meeting admin assignment is disabled. Assign group admins by email using group admin APIs.",
  });
};

exports.removeMeetingAdmin = async (req, res) => {
  return res.status(410).json({
    success: false,
    message:
      "Manual meeting admin removal is disabled. Remove group admins by email using group admin APIs.",
  });
};
