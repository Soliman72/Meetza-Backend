const { v4: uuidv4 } = require("uuid");
const groupContentService = require("./groupContentService");
const { extractArray } = require("../utils/extractArray");
const repo = require("../repositories/groupRepository");
const groupAdminService = require("./groupAdminService");
const db = require("../config/db");
const { ensureGroupAccess } = require("../utils/groupAccess");
const {
  validateCreateGroup,
  validateUpdateGroup,
  validateAddAdmin,
  validateRemoveAdmin,
} = require("../validators/groupValidator");
const { validateFileType } = require("../validators/validateFiles");
const { uploadToCloudinary } = require("../middleware/uploadFile");
const { isGroupAdmin } = require("../services/groupAdminService");
const { attachAdminsToGroups } = require("../utils/attachAdmin");
const userService = require("../services/userService");
const meetingAdminService = require("../services/meetingAdminService");
const groupMembershipService = require("../repositories/group_memberShipRepository");

exports.createGroup = async (req) => {
  validateCreateGroup(req.body);

  let admins = extractArray(req.body, "administrator_ids");

  if (req.body.administrator_id) {
    admins.push(req.body.administrator_id);
  }

  let adminIds = [];
  if (req.user.role === "Super_Admin") {
    adminIds = [...new Set(admins)];
    if (adminIds.length === 0) {
        throw new Error("at least one administrator_id or administrator_ids is required");
      }
  } else if (req.user.role === "Administrator") {
    adminIds = [...new Set([req.user.id, ...admins])];
  } else {
    throw new Error("You are not authorized to create a group");
  }

  if (adminIds.length > 0) {
    const validAdminIds = await repo.validateAdminIds(adminIds);
    if (validAdminIds.length !== adminIds.length) {
      throw new Error("One or more administrator_ids are not valid");
    }
  }
  
  let group_photo_url = null;
  if (req.files?.group_photo) {
    const file = req.files.group_photo[0];
    validateFileType(file, "image");
    group_photo_url = await uploadToCloudinary(file, "posters");
  } else if (req.body?.group_photo) {
    validateFileType(req.body.group_photo, "image");
    group_photo_url = req.body.group_photo;
  }


  const id = uuidv4();

  await repo.createGroup({
    id,
    ...req.body,
    group_photo: group_photo_url,
  });

  await Promise.all(
    adminIds.map((adminId) =>
      groupAdminService.assignGroupAdmin({
        groupId: id,
        userId: adminId,
        role: adminId === req.user.id ? "OWNER" : "ADMIN",
        assignedBy: req.user.id,
      })
    )
  );

  // create default content
  const content = await groupContentService.createGroupContent({
    content_name: req.body.group_content_name,
    content_description: req.body.group_content_description,
    group_id: id,
  });
  if (!content) {
    throw new Error("Failed to create default content");
  }

  return {
    id,
    ...req.body,
    group_content_id: content.id,
  };
};

exports.getAllGroups = async (req) => {
  const {rows} = await repo.getAllGroups(req);
  return await attachAdminsToGroups(rows);
};

exports.getGroupById = async (req) => {
    const group = await repo.getGroupById(req.params.id);
  
    if (!group) {
      throw { status: 404, message: "Group not found" };
    }
  
    if (!req.isSuperAdmin) {
      const allowed = await isGroupAdmin(req.user.id, group.id);
      if (!allowed) {
        throw { status: 403, message: "Access denied" };
      }
    }
  
    const [withAdmins] = await attachAdminsToGroups([group]);
    return withAdmins;
  };

exports.updateGroup = async (req) => {
    const { id } = req.params;
    validateUpdateGroup(req);
  
    // Check group exists and user is allowed
    const group = await repo.findById(id);
    if (!group) throw new Error("Group not found");
  
    if (!req.isSuperAdmin) {
      const allowed = await isGroupAdmin(req.user.id, id);
      if (!allowed) throw { status: 403, message: "Access denied" };
    }
  
    // Optional photo upload
    let group_photo_url = null;
    if (req.files?.group_photo) {
      const file = req.files.group_photo[0];
      validateFileType(file, "image");
      group_photo_url =
        await uploadToCloudinary(file, "group_photos");
    } else if (req.body?.group_photo) {
      validateFileType(req.body.group_photo, "image");
      group_photo_url = req.body.group_photo;
    }

    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([, value]) => value !== undefined)
    );
    if (group_photo_url !== null) {
      updates.group_photo = group_photo_url;
    }

    await repo.updateGroup(id, updates);
    return { message: "Updated" };
  };

exports.deleteGroup = async (req) => {
  const id = req.params.id;
  const group = await repo.findById(id);
  if (!group) throw new Error("Group not found");
  if (!req.isSuperAdmin) {
    const allowed = await isGroupAdmin(req.user.id, id);
    if (!allowed) throw { status: 403, message: "Access denied" };
  }
  await repo.delete(id);
};



exports.addGroupAdmin = async (req) => {
  const groupId = req.params.id;
  const { email, role = "ADMIN" } = req.body;

  let targetEmails = extractArray(req.body, "emails");
  if (email) targetEmails.push(email.trim());
  targetEmails = [...new Set(targetEmails)];
  
  validateAddAdmin({ groupId, userId: req.user?.id, role });
  
  await repo.findById(groupId);

  if (!req.isSuperAdmin) {
    await isGroupAdmin(req.user.id, groupId);
  }

  const meetings = await repo.getGroupMeetingIds(groupId);

  const results = [];

  for (const emailAddr of targetEmails) {
    try {
      const user = await userService.getUserByEmail(emailAddr);

      if (!user) {
        results.push({ email: emailAddr, success: false, message: "User not found" });
        continue;
      }

      if (user.role !== "Administrator") {
        results.push({ email: emailAddr, success: false, message: "Not admin" });
        continue;
      }

      await groupAdminService.assignGroupAdmin({
        groupId,
        userId: user.id,
        role,
        assignedBy: req.user.id,
      });

      for (const meeting of meetings) {
        await meetingAdminService.assignMeetingAdmin({
          meetingId: meeting.id,
          userId: user.id,
          role,
          assignedBy: req.user.id,
        });
      }

      results.push({ email: emailAddr, success: true });

    } catch (err) {
      results.push({ email: emailAddr, success: false, message: err.message });
    }
  }

  const allSuccessful = results.every(r => r.success);

  return {
    status: allSuccessful ? 200 : 207,
    body: {
      success: allSuccessful,
      data: results
    }
  };
};


exports.removeGroupAdmin = async (req) => {
  const groupId = req.params.id;

  validateRemoveAdmin({
    groupId,
    userId: req.user?.id,
    role: req.body?.role || "ADMIN",
  });
  
  let targetEmails = extractArray(req.body, "emails");
  if (req.body.email) targetEmails.push(req.body.email.trim());
  targetEmails = [...new Set(targetEmails)];

  if (targetEmails.length === 0) {
    return {
      status: 400,
      body: { success: false, message: "At least one email is required" },
    };
  }

  if (!req.isSuperAdmin) {
    await isGroupAdmin(req.user.id, groupId);
  }

  const results = [];

  for (const email of targetEmails) {
    try {
      const user = await repo.getUserByEmail(email, groupId);

      if (!user) {
        results.push({ email, success: false, message: "User not found" });
        continue;
      }

      const adminRecord = await repo.getOwner(groupId);

      if (!adminRecord) {
        results.push({ email, success: false, message: "Admin not found" });
        continue;
      }

      if (adminRecord.role === "OWNER") {
        const ownersCount = await repo.countOwners(groupId);
        if (ownersCount <= 1) {
          results.push({
            email,
            success: false,
            message: "Cannot remove last owner",
          });
          continue;
        }
      }

      await repo.removeGroupAdmin(groupId, user.id);
      await repo.removeMeetingAdminByUser(groupId, user.id);

      results.push({ email, success: true });
    } catch (err) {
      results.push({ email, success: false, message: err.message });
    }
  }

  const success = results.some(r => r.success);

  return {
    status: success ? 200 : 400,
    body: {
      success,
      message: success ? "Operation completed" : "No admins removed",
      data: results,
    },
  };
};

exports.leaveGroup = async (req) => {
  const groupId = req.params?.id;
  const userId = req.user?.id;

  if (!userId || !groupId) {
    return {
      status: 400,
      body: {
        success: false,
        message:
          "group id is required and user must be authenticated",
      },
    };
  }

  await ensureGroupAccess(userId, groupId);

  const { new_admin_id, new_admin_role } = req.body || {};
  const conn = await db.promise().getConnection();

  try {
    const myAdminRows = await repo.leaveSelectMyAdminRole(conn, groupId, userId);
    const isAdmin = myAdminRows.length > 0;
    const myAdminRole = isAdmin ? myAdminRows[0].role : null;

    if (isAdmin) {
      const otherAdmins = await repo.leaveCountOtherAdmins(
        conn,
        groupId,
        userId
      );

      if (otherAdmins === 0) {
        if (!new_admin_id) {
          const admins = await repo.leaveListAdministratorCandidates(
            conn,
            userId
          );

          return {
            status: 409,
            body: {
              success: false,
              code: "LAST_ADMIN_ASSIGN_REQUIRED",
              message:
                "You are the last admin in this group. Assign a new admin before leaving.",
              data: {
                group_id: groupId,
                current_admin_role: myAdminRole,
                admins,
              },
            },
          };
        }

        const validAdmin = await repo.leaveFindAdministratorByUserId(
          conn,
          new_admin_id
        );
        if (validAdmin.length === 0) {
          return {
            status: 400,
            body: {
              success: false,
              message: "new_admin_id must be an Administrator user",
            },
          };
        }

        const roleToAssign =
          new_admin_role && ["OWNER", "ADMIN"].includes(new_admin_role)
            ? new_admin_role
            : myAdminRole === "OWNER"
              ? "OWNER"
              : "ADMIN";

        await conn.beginTransaction();

        await repo.leaveUpsertGroupAdmin(conn, {
          id: uuidv4(),
          groupId,
          userId: new_admin_id,
          role: roleToAssign,
          assignedBy: userId,
        });

        const meetingIds = await repo.leaveSelectMeetingIdsByGroup(
          conn,
          groupId
        );
        for (const m of meetingIds) {
          await repo.leaveUpsertMeetingAdmin(conn, {
            id: uuidv4(),
            meetingId: m.id,
            userId: new_admin_id,
            role: roleToAssign,
            assignedBy: userId,
          });
        }

        await repo.leaveDeleteGroupAdmin(conn, groupId, userId);
        await repo.leaveDeleteMeetingAdminsForUserInGroup(
          conn,
          groupId,
          userId
        );

        await repo.leaveDeleteGroupMembership(conn, groupId, userId);

        await conn.commit();

        return {
          status: 200,
          body: {
            success: true,
            message: "Left group successfully",
            data: {
              group_id: groupId,
              assigned_new_admin: { id: new_admin_id, role: roleToAssign },
            },
          },
        };
      }
    }

    await conn.beginTransaction();
    await repo.leaveDeleteGroupMembership(conn, groupId, userId);
    await repo.leaveDeleteGroupAdmin(conn, groupId, userId);
    await repo.leaveDeleteMeetingAdminsForUserInGroup(conn, groupId, userId);
    await conn.commit();

    return {
      status: 200,
      body: {
        success: true,
        message: "Left group successfully",
        data: { group_id: groupId },
      },
    };
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_e) {
      /* ignore */
    }
    throw err;
  } finally {
    conn.release();
  }
};