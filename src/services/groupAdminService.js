const { v4: uuidv4 } = require("uuid");
const repo = require("../repositories/groupAdminRepository");

exports.isGroupAdmin = async (userId, groupId) => {
  const admin = await repo.findGroupAdmin(groupId, userId);
  return !!admin;
};

exports.assignGroupAdmin = async ({
  groupId,
  userId,
  role = "ADMIN",
  assignedBy = null,
}) => {
  await repo.upsertGroupAdmin({
    id: uuidv4(),
    groupId,
    userId,
    role,
    assignedBy,
  });
};

exports.transferGroupAdmin = async ({groupId, fromUserId, toUserId, fromRole, toRole}) => {
  await repo.updateGroupAdmin(groupId, toUserId, toRole);
  if (fromRole === "OWNER") {
    await repo.updateGroupAdmin(groupId, toUserId, "OWNER");
  }
}
