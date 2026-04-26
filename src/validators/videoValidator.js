const groupRepository = require("../repositories/groupRepository");
const meetingRepository = require("../repositories/meetingRepository");

exports.createVideoValidator = async (req) => {
  const { group_id, title, meeting_id } = req.body;
  if (!group_id || !title) {
    throw new Error("group_id and title are required");
  }
  if (!req.files && (!req.body.video_file || !req.body.poster_file)) {
    throw new Error("Both video and poster files are required");
  }

  const group = await groupRepository.getGroupById(group_id);
  if (!group) {
    throw new Error("Group not found");
  }

  if (meeting_id) {
    const meeting = await meetingRepository.getMeetingById(meeting_id);
    if (!meeting) {
      throw new Error("Meeting not found");
    }
  }

  const groupAdmins = await groupRepository.getGroupAdmins(group_id);
  if (!groupAdmins.length) {
    throw new Error("Group administrators not found");
  }

  const isSuperAdmin =
    req.isSuperAdmin === true || req.user?.role === "Super_Admin";

  if (isSuperAdmin) {
    const administratorId = String(req.body?.administrator_id || "").trim();
    if (!administratorId) {
      throw new Error(
        "administrator_id is required when creating a video as Super Admin"
      );
    }
    const ok = groupAdmins.some(
      (a) => String(a.user_id) === administratorId
    );
    if (!ok) {
      throw new Error(
        "administrator_id must be an administrator of this group"
      );
    }
    return;
  }

  let hasPermission = false;
  for (let i = 0; i < groupAdmins.length; i++) {
    if (groupAdmins[i].user_id === req.user.id) {
      hasPermission = true;
      break;
    }
  }
  if (!hasPermission) {
    throw new Error("You are not an administrator of this group");
  }
};

exports.validateVideoIdParam = (id) => {
  if (!id || String(id).trim() === "") {
    const e = new Error("Video id is required");
    e.status = 400;
    throw e;
  }
};
