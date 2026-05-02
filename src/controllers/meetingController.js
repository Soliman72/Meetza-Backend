const meetingService = require("../services/meetingService");

const sendError = (res, err) => {
  const status =
    err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const body = { success: false, message: err.message };
  if (status >= 500) body.error = err.message;
  return res.status(status).json(body);
};

exports.createMeeting = async (req, res) => {
  try {
    const data = await meetingService.createMeeting(req);
    return res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data,
    });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getAllMeetings = async (req, res) => {
  try {
    const data = await meetingService.getAllMeetings(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const data = await meetingService.getMeetingById(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.updateMeetingById = async (req, res) => {
  try {
    await meetingService.updateMeetingById(req);
    return res
      .status(200)
      .json({ success: true, message: "Meeting updated successfully" });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.deactivateMeetingRecurrence = async (req, res) => {
  try {
    await meetingService.deactivateMeetingRecurrence(req);
    return res.status(200).json({
      success: true,
      message: "Weekly recurrence stopped for this meeting's series.",
    });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.activateMeetingRecurrence = async (req, res) => {
  try {
    const data = await meetingService.activateMeetingRecurrence(req);
    if (data.series_id) {
      return res.status(200).json({
        success: true,
        message: "Weekly recurrence activated successfully.",
        data: { series_id: data.series_id },
      });
    }
    return res.status(200).json({
      success: true,
      message: "Weekly recurrence started for this series.",
    });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.deleteMeetingById = async (req, res) => {
  try {
    const { scope, had_series } = await meetingService.deleteMeetingById(req);
    return res.status(200).json({
      success: true,
      message:
        scope === "series" && had_series
          ? "Meeting series deleted successfully"
          : "Meeting deleted successfully",
    });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.joinMeeting = async (req, res) => {
  try {
    const result = await meetingService.joinMeeting(req);
    if (result.already) {
      return res.status(200).json({
        success: true,
        message: "You are already in this meeting",
        data: { meeting_id: result.meeting_id, userId: result.userId },
      });
    }
    return res.status(201).json({
      success: true,
      message: "Joined the meeting successfully",
      data: {
        id: result.id,
        meeting_id: result.meeting_id,
        userId: result.userId,
      },
    });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.leaveMeeting = async (req, res) => {
  try {
    await meetingService.leaveMeeting(req);
    return res
      .status(200)
      .json({ success: true, message: "Left the meeting successfully" });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getMeetingParticipants = async (req, res) => {
  try {
    const data = await meetingService.getMeetingParticipants(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};
