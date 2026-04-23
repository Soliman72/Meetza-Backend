const { v4: uuidv4 } = require("uuid");
const repo = require("../repositories/meetingAdminRepository");

exports.isMeetingAdmin = async (userId, meetingId) => {
  const admin = await repo.findMeetingAdmin(meetingId, userId);
  return !!admin;
};

exports.assignMeetingAdmin = async ({
  meetingId,
  userId,
  role = "ADMIN",
  assignedBy = null,
}) => {
  await repo.upsertMeetingAdmin({
    id: uuidv4(),
    meetingId,
    userId,
    role,
    assignedBy,
  });
};