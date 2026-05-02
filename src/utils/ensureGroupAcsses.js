class GroupAccessError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "GroupAccessError";
    this.statusCode = statusCode;
  }
}

exports.GroupAccessError = GroupAccessError;

const groupRepo = require("../repositories/groupRepository");

exports.ensureGroupAcsses = async (userId, groupId) => {
  const userRole = await groupRepo.getUserRole(userId);

  let group;

  if (userRole === "Super_Admin") {
    group = await groupRepo.getGroupAsSuperAdmin(groupId);

    if (!group) {
      throw new GroupAccessError("Group not found", 404);
    }

  } else {
    group = await groupRepo.getGroupWithAccess(userId, groupId);

    if (!group) {
      throw new GroupAccessError("Group not found", 404);
    }

    if (!group.membership_role) {
      throw new GroupAccessError("You do not have access to this group", 403);
    }
  }

  const [media, admins] = await Promise.all([
    groupRepo.getGroupMedia(groupId),
    groupRepo.getGroupAdmins(groupId),
  ]);

  return {
    ...group,
    group_media: media,
    admins,
  };
};
