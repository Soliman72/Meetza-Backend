const { v4: uuidv4 } = require("uuid");
const repo = require("../repositories/meetingRepository");
const groupContentRepo = require("../repositories/groupContentRepository");
const meetingValidator = require("../validators/meetingValidator");
const {
  parseWeeklyFlag,
  getDateFilterForMeetings,
} = require("../utils/meetingQueryFilter");
const { isGroupAdmin } = require("./groupAdminService");
const { isMeetingAdmin, assignMeetingAdmin } = require("./meetingAdminService");
const { createNotification } = require("./notificatioService");
const {
  activateWeeklySeries,
  deactivateSeriesInDb,
  reactivateSeriesInDb,
} = require("./meetingRecurrenceScheduler");
const {
  uploadToCloudinary,
  uploadToCloudinaryResources,
} = require("../middleware/uploadFile");
const { validateFileType } = require("../validators/validateFiles");
const { ensureGroupAccess, GroupAccessError } = require("../utils/groupAccess");

const httpError = (status, message) => {
  const e = new Error(message);
  e.status = status;
  return e;
};

exports.createMeeting = async (req) => {
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
  const { isWeekly } = meetingValidator.validateCreateMeeting({
    title,
    start_time,
    end_time,
    group_id,
    status,
    recording,
    weekly,
    posterFiles: req.files?.poster_file,
    bodyPoster: req.body.poster_file,
  });

  const group = await repo.findGroupById(group_id);
  if (!group) {
    throw httpError(400, "Invalid group_id: not found");
  }

  const requesterId = req.user?.id ?? req.administratorId;
  meetingValidator.assertAuthenticatedUserId(requesterId);

  const isRequesterAdmin = await isGroupAdmin(requesterId, group_id);
  if (!req.isSuperAdmin && !isRequesterAdmin) {
    throw httpError(
      403,
      "Only group admins and super admin can create meetings for it"
    );
  }

  const overlap = await repo.countScheduledOverlap(
    group_id,
    start_time,
    end_time
  );
  if (overlap.length > 0) {
    throw httpError(
      409,
      "This group already has a Scheduled meeting at that time. Create meetings at a different time."
    );
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

  if (req.files?.files?.length > 0) {
    const gc = await groupContentRepo.findFirstContentByGroupId(group_id);
    if (!gc) {
      throw httpError(404, "Group content not found");
    }
    const uploaded = [];
    for (const file of req.files.files) {
      try {
        const isDocument =
          file.mimetype &&
          (file.mimetype.includes("pdf") ||
            file.mimetype.includes("document") ||
            file.mimetype.includes("msword") ||
            file.mimetype.includes("spreadsheet") ||
            file.mimetype.includes("presentation") ||
            file.mimetype.includes("text"));
        const resourceType = isDocument ? "raw" : "auto";
        const fileUrl = await uploadToCloudinaryResources(
          file,
          "group_content_resources",
          resourceType
        );
        const resourceId = uuidv4();
        await groupContentRepo.insertResource({
          id: resourceId,
          group_content_id: gc.id,
          file_url: fileUrl,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_size: file.size,
          meeting_id: id,
        });
        uploaded.push(resourceId);
      } catch (fileError) {
        console.error(`Error uploading file ${file.originalname}:`, fileError);
      }
    }
    if (uploaded.length === 0) {
      throw httpError(500, "Failed to upload any files");
    }
  }

  const seriesId = isWeekly ? uuidv4() : null;
  await repo.insertMeeting({
    id,
    title,
    start_time,
    end_time,
    status,
    group_id,
    poster_url: posterUrl,
    description,
    recording,
    is_weekly: isWeekly ? 1 : 0,
    series_id: seriesId,
  });

  const groupAdmins = await repo.getGroupAdminsWithRoles(group_id);
  await Promise.all(
    groupAdmins.map((admin) =>
      assignMeetingAdmin({
        meetingId: id,
        userId: admin.user_id,
        role: admin.role || "ADMIN",
        assignedBy: req.user.id,
      })
    )
  );

  if (isWeekly) {
    const start = new Date(start_time);
    const end = new Date(end_time);
    const durationMs = end.getTime() - start.getTime();
    const ownerId =
      (await repo.getGroupOwnerUserId(group_id)) || requesterId;
    try {
      await activateWeeklySeries({
        seriesId,
        groupId: group_id,
        administratorId: ownerId,
        originalMeetingId: id,
        templateTitle: title,
        templatePosterUrl: posterUrl,
        templateDescription: description,
        templateRecording: recording,
        durationMs,
        startDate: start,
      });
    } catch (recErr) {
      await repo.deleteMeetingById(id);
      const e = new Error(
        "Meeting was not created: failed to activate weekly schedule"
      );
      e.status = 500;
      e.cause = recErr;
      throw e;
    }
  }

  try {
    const memberIds = await repo.getMemberIdsByGroupId(group_id);
    const notificationTitle = "New meeting scheduled";
    const notificationMessage = `A new meeting \"${title}\" is scheduled from ${start_time} to ${end_time}.`;
    await Promise.all(
      memberIds.map((memberId) =>
        createNotification({
          senderId: requesterId,
          memberId,
          title: notificationTitle,
          message: notificationMessage,
        })
      )
    );
  } catch (notifyErr) {
    console.error("Failed to send meeting notifications:", notifyErr);
  }

  return {
    id,
    title,
    start_time,
    end_time,
    group_id,
    status,
    poster_url: posterUrl,
    description,
    recording,
    weekly: isWeekly,
    series_id: seriesId,
  };
};

exports.getAllMeetings = async (req) => {
  const userId = req.user?.id;
  const { title, group_id } = req.query;
  const dateFilter = getDateFilterForMeetings(req.query);
  if (dateFilter?.error) {
    throw httpError(400, dateFilter.error);
  }

  if (group_id) {
    try {
      await ensureGroupAccess(userId, group_id);
    } catch (e) {
      if (e.name === "GroupAccessError") {
        throw httpError(e.statusCode, e.message);
      }
      throw e;
    }
  }

  const dateClause = dateFilter?.clause || null;
  const dateParams = dateFilter?.params || [];

  if (req.user.role === "Member") {
    const meetings = await repo.listMeetingsForMember(userId, {
      group_id,
      title,
      dateClause,
      dateParams,
    });
    return repo.attachAdminsToMeetings(meetings);
  }
  if (req.user.role === "Super_Admin" || req.user.role === "Administrator") {
    const meetings =
      req.user.role === "Super_Admin"
        ? await repo.listMeetingsSuperAdmin({
            title,
            group_id,
            dateClause,
            dateParams,
          })
        : await repo.listMeetingsForAdministrator(userId, {
            title,
            group_id,
            dateClause,
            dateParams,
          });
    return repo.attachAdminsToMeetings(meetings);
  }

  throw httpError(403, "Access denied");
};

exports.getMeetingById = async (req) => {
  const { id } = req.params;
  meetingValidator.validateMeetingIdParam(id);
  const userId = req.user?.id;

  const meeting = await repo.findMeetingById(id);
  if (!meeting) {
    throw httpError(404, "Meeting not found");
  }

  const isSuperAdmin = req.user?.role === "Super_Admin";
  const isMeetingAdminUser = await isMeetingAdmin(userId, id);

  if (isSuperAdmin || isMeetingAdminUser) {
    const withAdmins = await repo.attachAdminsToMeetings([meeting]);
    return withAdmins[0];
  }

  const membership = await repo.findGroupMembership(meeting.group_id, userId);
  if (membership) {
    const withAdmins = await repo.attachAdminsToMeetings([meeting]);
    return withAdmins[0];
  }

  throw httpError(403, "You do not have access to this meeting");
};

exports.updateMeetingById = async (req) => {
  const { id } = req.params;
  meetingValidator.validateMeetingIdParam(id);
  meetingValidator.validateRecordingIfPresent(req.body.recording);

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

  const existing = await repo.findMeetingById(id);
  if (!existing) {
    throw httpError(404, "Meeting not found");
  }

  const meeting = { ...existing };
  const canUpdate =
    req.user.role === "Super_Admin" ||
    (req.user.role === "Administrator" &&
      (await isMeetingAdmin(req.user.id, id)));
  if (!canUpdate) {
    throw httpError(403, "Only meeting admins can update this meeting");
  }

  const updates = [];
  const params = [];
  if (title != null) {
    updates.push("title = ?");
    params.push(title);
  }

  const { newStart, newEnd } = meetingValidator.validateDateRange(
    start_time,
    end_time,
    meeting
  );

  if (start_time != null) {
    updates.push("start_time = ?");
    params.push(start_time);
  }
  if (end_time != null) {
    updates.push("end_time = ?");
    params.push(end_time);
  }
  if (status != null) {
    meetingValidator.validateStatusValue(status);
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
  if (posterUrl) {
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
    throw httpError(
      400,
      "At least one field to update is required (title, start_time, end_time, status, group_id, description, poster_url, recording, weekly)"
    );
  }

  const effectiveStatus = status != null ? status : meeting.status;
  if (effectiveStatus === "Scheduled") {
    const overlap = await repo.countScheduledOverlap(
      group_id || meeting.group_id,
      newEnd,
      newStart,
      id
    );
    if (overlap.length > 0) {
      throw httpError(
        409,
        "This group already has a Scheduled meeting at that time. Choose a different time range."
      );
    }
  }

  await repo.updateMeetingById(updates.join(", "), params, id);

  if (isWeeklyChanged) {
    try {
      if (isWeeklyNewVal) {
        if (isWeeklyNewVal && !originalSeriesId) {
          const durationMs = newEnd.getTime() - newStart.getTime();
          const ownerId =
            (await repo.getGroupOwnerUserId(group_id || meeting.group_id)) ||
            req.user.id;

          await activateWeeklySeries({
            seriesId: meeting.series_id,
            groupId: group_id || meeting.group_id,
            administratorId: ownerId,
            originalMeetingId: id,
            templateTitle: title ?? meeting.title,
            templatePosterUrl: posterUrl || meeting.poster_url,
            templateDescription: description ?? meeting.description,
            templateRecording: recording ?? meeting.recording,
            durationMs,
            startDate: newStart,
          });
        } else {
          await reactivateSeriesInDb(meeting.series_id);
        }
      } else if (originalSeriesId) {
        await deactivateSeriesInDb(originalSeriesId);
      }
    } catch (recErr) {
      console.error("Failed to toggle recurrence during update:", recErr);
    }
  }

  try {
    const effectiveSeriesId = meeting.series_id;
    const didTemplateChange =
      title != null ||
      description != null ||
      posterUrl ||
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
      if (posterUrl) {
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
        await repo.updateMeetingSeriesTemplate(
          sets.join(", "),
          sParams,
          effectiveSeriesId
        );
      }
    }
  } catch (e) {
    console.error("Failed to sync meeting_series template:", e);
  }

  try {
    const effectiveGroupId = group_id || meeting.group_id;
    const effectiveTitle = title ?? meeting.title;
    const effectiveStart = start_time ?? meeting.start_time;
    const effectiveEnd = end_time ?? meeting.end_time;

    const memberIds = await repo.getMemberIdsByGroupId(effectiveGroupId);
    const notificationTitle = "Meeting updated";
    const notificationMessage = `The meeting "${effectiveTitle}" has been updated. New schedule: ${effectiveStart} to ${effectiveEnd}.`;

    const senderId =
      (await repo.getGroupOwnerUserId(effectiveGroupId)) || req.user.id;

    await Promise.all(
      memberIds.map((memberId) =>
        createNotification({
          senderId,
          memberId,
          title: notificationTitle,
          message: notificationMessage,
        })
      )
    );
  } catch (notifyErr) {
    console.error("Failed to send meeting update notifications:", notifyErr);
  }

  return { ok: true };
};

exports.deactivateMeetingRecurrence = async (req) => {
  const { id } = req.params;
  meetingValidator.validateMeetingIdParam(id);

  const meeting = await repo.findMeetingById(id);
  if (!meeting) {
    throw httpError(404, "Meeting not found");
  }

  if (!req.isSuperAdmin && !(await isMeetingAdmin(req.user?.id, id))) {
    throw httpError(
      403,
      "Only the meeting administrator or a super admin can stop recurrence"
    );
  }

  if (!meeting.series_id) {
    throw httpError(400, "Meeting is not part of a recurrence series");
  }

  const series = await repo.findMeetingSeriesById(meeting.series_id);
  if (!series) {
    throw httpError(404, "Meeting series not found");
  }

  await deactivateSeriesInDb(meeting.series_id);
  return { ok: true };
};

exports.activateMeetingRecurrence = async (req) => {
  const { id } = req.params;
  meetingValidator.validateMeetingIdParam(id);

  const meeting = await repo.findMeetingById(id);
  if (meeting) {
    if (!req.isSuperAdmin && !(await isMeetingAdmin(req.user?.id, id))) {
      throw httpError(
        403,
        "Only the meeting administrator or a super admin can activate recurrence"
      );
    }

    let seriesId = meeting.series_id;

    if (!seriesId) {
      seriesId = uuidv4();
      await repo.setMeetingWeeklyAndSeries(id, seriesId);
    } else {
      await repo.setMeetingWeeklyOnly(id);
    }

    const seriesRows = await repo.findMeetingSeriesById(seriesId);

    if (!seriesRows) {
      const start = new Date(meeting.start_time);
      const end = new Date(meeting.end_time);
      const durationMs = end.getTime() - start.getTime();
      try {
        await activateWeeklySeries({
          seriesId,
          groupId: meeting.group_id,
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
        const e = new Error("Failed to activate weekly schedule");
        e.status = 500;
        throw e;
      }
    } else {
      await reactivateSeriesInDb(seriesId);
    }

    return { series_id: seriesId };
  }

  const seriesCheck = await repo.findMeetingSeriesById(id);
  if (!seriesCheck) {
    throw httpError(404, "Meeting or Series not found");
  }

  if (
    !req.isSuperAdmin &&
    !(await isMeetingAdmin(
      req.user?.id,
      seriesCheck.original_meeting_id || id
    ))
  ) {
    throw httpError(
      403,
      "Only the series administrator or a super admin can start recurrence"
    );
  }

  await reactivateSeriesInDb(id);
  return { ok: true };
};

exports.deleteMeetingById = async (req) => {
  const { id } = req.params;
  const scopeRaw = req.query?.scope;
  const scope =
    scopeRaw && String(scopeRaw).toLowerCase() === "series" ? "series" : "single";
  meetingValidator.validateMeetingIdParam(id);

  const meeting = await repo.findMeetingById(id);
  if (!meeting) {
    throw httpError(404, "Meeting not found");
  }

  if (!req.isSuperAdmin && !(await isMeetingAdmin(req.user?.id, id))) {
    throw httpError(
      403,
      "Only the meeting administrator can delete this meeting"
    );
  }

  if (scope === "series" && meeting.series_id) {
    const seriesId = meeting.series_id;
    await deactivateSeriesInDb(seriesId);
    await repo.deleteMeetingsBySeriesId(seriesId);
    await repo.deleteMeetingSeriesById(seriesId);
  } else {
    await repo.deleteMeetingById(id);
  }

  try {
    const memberIds = await repo.getMemberIdsByGroupId(meeting.group_id);
    const notificationTitle =
      scope === "series" && meeting.series_id
        ? "Meeting series deleted"
        : "Meeting deleted";
    const notificationMessage =
      scope === "series" && meeting.series_id
        ? `The weekly meeting series "${meeting.title}" has been deleted forever.`
        : `The meeting "${meeting.title}" scheduled for ${meeting.start_time} has been deleted.`;

    const senderId = await repo.getFirstGroupAdminUserId(meeting.group_id);
    if (senderId) {
      await Promise.all(
        memberIds.map((memberId) =>
          createNotification({
            senderId,
            memberId,
            title: notificationTitle,
            message: notificationMessage,
          })
        )
      );
    }
  } catch (notifyErr) {
    console.error("Failed to send meeting deletion notifications:", notifyErr);
  }

  return { scope, had_series: !!meeting.series_id };
};

exports.joinMeeting = async (req) => {
  const { id: meetingId } = req.params;
  const userId = req.user?.id;
  if (!userId || !meetingId) {
    throw httpError(
      400,
      "Meeting id is required and user must be authenticated"
    );
  }

  const meeting = await repo.findMeetingById(meetingId);
  if (!meeting) {
    throw httpError(404, "Meeting not found");
  }

  const membership = await repo.findGroupMembership(meeting.group_id, userId);
  if (!membership && req.user.role === "Member") {
    throw httpError(
      403,
      "Only members of this meeting's group can join the meeting"
    );
  }
  if (req.user.role === "Administrator") {
    const ok = await isMeetingAdmin(userId, meetingId);
    if (!ok) {
      throw httpError(
        403,
        "You are not an Administrator of this meeting's group!"
      );
    }
  }

  const existing = await repo.findMeetingParticipant(meetingId, userId);
  if (existing) {
    return { already: true, meeting_id: meetingId, userId };
  }

  const participantId = uuidv4();
  await repo.insertMeetingParticipant(participantId, meetingId, userId);
  return { already: false, id: participantId, meeting_id: meetingId, userId };
};

exports.leaveMeeting = async (req) => {
  const { id: meetingId } = req.params;
  const userId = req.user?.id;
  if (!userId || !meetingId) {
    throw httpError(
      400,
      "Meeting id is required and user must be authenticated"
    );
  }

  const affected = await repo.deleteMeetingParticipant(meetingId, userId);
  if (!affected) {
    throw httpError(
      404,
      "You were not in this meeting or the meeting does not exist"
    );
  }
  return { ok: true };
};

exports.getMeetingParticipants = async (req) => {
  const { id: meetingId } = req.params;
  if (!meetingId) {
    throw httpError(400, "Meeting id is required");
  }

  const meeting = await repo.findMeetingById(meetingId);
  if (!meeting) {
    throw httpError(404, "Meeting not found");
  }

  const userId = req.user?.id;
  const isMeetingAdminUser = await isMeetingAdmin(userId, meetingId);
  const isSuperAdmin = req.user?.role === "Super_Admin";

  if (!isSuperAdmin && !isMeetingAdminUser) {
    const membership = await repo.findGroupMembership(meeting.group_id, userId);
    if (!membership) {
      throw httpError(
        403,
        "Only the meeting admins or group members can view participants"
      );
    }
  }

  return repo.listMeetingParticipants(meetingId);
};

/** Re-export list filters for tests or other modules. */
exports.parseWeeklyFlag = parseWeeklyFlag;
exports.getDateFilterForMeetings = getDateFilterForMeetings;
exports.attachAdminsToMeetings = repo.attachAdminsToMeetings;
