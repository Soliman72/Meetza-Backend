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
};

exports.validateVideoIdParam = (id) => {
  if (!id || String(id).trim() === "") {
    const e = new Error("Video id is required");
    e.status = 400;
    throw e;
  }
};
