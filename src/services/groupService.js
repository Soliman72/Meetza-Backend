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
  normalizeGroupYear,
  normalizeGroupSemester,
  normalizePendingGroupStatus,
} = require("../validators/groupValidator");
const { validateFileType } = require("../validators/validateFiles");
const { uploadToCloudinary } = require("../middleware/uploadFile");
const { isGroupAdmin } = require("../services/groupAdminService");
const { attachAdminsToGroups } = require("../utils/attachAdmin");
const userService = require("../services/userService");
const meetingAdminService = require("../services/meetingAdminService");
const groupMembershipService = require("../repositories/group_memberShipRepository");
const userRepository = require("../repositories/userRepository");
const { createNotification } = require("./notificatioService");
const {
  signPendingGroupAction,
  verifyPendingGroupActionToken,
} = require("../utils/pendingGroupEmailToken");
const {
  DEFAULT_EMAIL_REJECTION_REASON,
  getPublicApiBaseUrl,
  buildPendingGroupEmailActionUrl,
} = require("../utils/pendingGroupEmailHelpers");
const notificationPendingGroupActionRepo = require("../repositories/notificationPendingGroupActionRepository");

const createApprovedGroup = async ({
  id,
  body,
  adminIds,
  ownerId,
  assignedBy,
  groupPhotoUrl,
}) => {
  await repo.createGroup({
    id,
    ...body,
    year: normalizeGroupYear(body.year),
    semester: normalizeGroupSemester(body.semester),
    group_photo: groupPhotoUrl,
  });

  await Promise.all(
    adminIds.map((adminId) =>
      groupAdminService.assignGroupAdmin({
        groupId: id,
        userId: adminId,
        role: adminId === ownerId ? "OWNER" : "ADMIN",
        assignedBy,
      })
    )
  );

  return groupContentService.createGroupContent({
    content_name: body.group_content_name || `${body.group_name} Content`,
    content_description:
      body.group_content_description || body.description || null,
    group_id: id,
  });
};

const notifySuperAdminsForPendingGroup = async ({
  senderId,
  groupName,
  pendingGroupId,
  req,
}) => {
  const superAdmins = await userRepository.findByRole("Super_Admin");
  const apiBase = getPublicApiBaseUrl(req);

  await Promise.allSettled(
    superAdmins.map((admin) => {
      const approveToken = signPendingGroupAction({
        pendingGroupId,
        reviewerId: admin.id,
        action: "approve",
      });
      const rejectToken = signPendingGroupAction({
        pendingGroupId,
        reviewerId: admin.id,
        action: "reject",
      });
      const approveUrl = buildPendingGroupEmailActionUrl(apiBase, approveToken);
      const rejectUrl = buildPendingGroupEmailActionUrl(apiBase, rejectToken);

      const status = repo.getPendingGroupStatus(pendingGroupId);

      return createNotification({
        senderId,
        memberId: admin.id,
        title: "New group pending approval",
        message: `A new group "${groupName}" is waiting for your approval.`,
        type: "GROUP_APPROVAL",
        emailHeaderTagline: "Group approval",
        emailActions: { approveUrl, rejectUrl },
        pendingGroupApproval: {
          pendingGroupId,
          approveUrl,
          rejectUrl,
          status: status,
        },
      });
    })
  );
};

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

  if (!req.isSuperAdmin && req.user.role === "Administrator") {
    await repo.createPendingGroup({
      id,
      group_name: req.body.group_name,
      description: req.body.description,
      group_photo: group_photo_url,
      year: normalizeGroupYear(req.body.year),
      semester: normalizeGroupSemester(req.body.semester),
      created_by: req.user.id,
      status: "pending",
    });

    await Promise.all(
      adminIds.map((adminId) =>
        repo.createPendingGroupAdmin({
          id: uuidv4(),
          pending_group_id: id,
          user_id: adminId,
          role: adminId === req.user.id ? "OWNER" : "ADMIN",
          assigned_by: req.user.id,
        })
      )
    );

    await notifySuperAdminsForPendingGroup({
      senderId: req.user.id,
      groupName: req.body.group_name,
      pendingGroupId: id,
      req,
    });

    return {
      id,
      ...req.body,
      status: "pending",
      message: "Group creation request sent to Super Admins for approval.",
    };
  }

  const content = await createApprovedGroup({
    id,
    body: req.body,
    adminIds,
    ownerId: req.user.id,
    assignedBy: req.user.id,
    groupPhotoUrl: group_photo_url,
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

exports.getPendingGroups = async (req) => {
  if (!req.isSuperAdmin && req.user.role !== "Super_Admin") {
    throw { status: 403, message: "Access denied. Super Admins only." };
  }

  const pendingGroups = await repo.getPendingGroups();
  const groupsWithAdmins = await Promise.all(
    pendingGroups.map(async (group) => ({
      ...group,
      admins: await repo.getPendingGroupAdmins(group.id),
    }))
  );

  return groupsWithAdmins;
};

const notifyPendingGroupDecisionFollowUp = async ({
  pendingGroup,
  status,
  rejection_reason,
  decidedByUserId,
}) => {
  const groupName = pendingGroup.group_name;
  const reviewer = await userRepository.findById(decidedByUserId);
  const reviewerName = reviewer?.name || "A Super Admin";
  const creatorId = pendingGroup.created_by;

  if (creatorId && creatorId !== decidedByUserId) {
    if (status === "approved") {
      await createNotification({
        senderId: decidedByUserId,
        memberId: creatorId,
        title: "Group approved",
        message: `Your group "${groupName}" was approved by ${reviewerName}.`,
        type: "GROUP_APPROVAL_RESULT",
        emailOptional: true,
      });
    } else {
      await createNotification({
        senderId: decidedByUserId,
        memberId: creatorId,
        title: "Group rejected",
        message: `Your group "${groupName}" was rejected by ${reviewerName}. Reason: ${rejection_reason}`,
        type: "GROUP_APPROVAL_RESULT",
        emailOptional: true,
      });
    }
  }

  await createNotification({
    senderId: decidedByUserId,
    memberId: decidedByUserId,
    title: status === "approved" ? "Approval recorded" : "Rejection recorded",
    message:
      status === "approved"
        ? `You approved "${groupName}". The group is now active.`
        : `You rejected "${groupName}".`,
    type: "GROUP_APPROVAL_RESULT",
    skipEmail: true,
  });
};

const processPendingGroupDecision = async ({
  pendingGroupId: id,
  status,
  rejection_reason,
  decidedByUserId,
}) => {
  if (!["approved", "rejected"].includes(status)) {
    throw { status: 400, message: "Status must be approved or rejected" };
  }
  // if (status === "rejected" && !rejection_reason) {
  //   throw { status: 400, message: "Rejection reason is required" };
  // }

  const pendingGroup = await repo.findPendingGroupById(id);
  if (!pendingGroup) {
    throw { status: 404, message: "Pending group not found" };
  }
  if (pendingGroup.status !== "pending") {
    throw { status: 400, message: "Pending group is already processed" };
  }

  await repo.updatePendingGroupStatus({
    id,
    status,
    approvedBy: status === "approved" ? decidedByUserId : null,
    rejectedBy: status === "rejected" ? decidedByUserId : null,
    rejectionReason: status === "rejected" ? rejection_reason : null,
  });

  await notificationPendingGroupActionRepo.updateStatus({
    pendingGroupId: id,
    status,
  });

  if (status === "rejected") {
    await notifyPendingGroupDecisionFollowUp({
      pendingGroup,
      status,
      rejection_reason,
      decidedByUserId,
    });
    return {
      id,
      status,
      message: "Pending group rejected successfully.",
    };
  }

  const pendingAdmins = await repo.getPendingGroupAdmins(id);
  const adminIds = pendingAdmins.map((admin) => admin.user_id);
  const ownerId =
    pendingAdmins.find((admin) => admin.role === "OWNER")?.user_id ||
    pendingGroup.created_by;

  const content = await createApprovedGroup({
    id,
    body: {
      group_name: pendingGroup.group_name,
      description: pendingGroup.description,
      year: pendingGroup.year,
      semester: pendingGroup.semester,
      group_content_name: `${pendingGroup.group_name} Content`,
      group_content_description: pendingGroup.description,
    },
    adminIds,
    ownerId,
    assignedBy: decidedByUserId,
    groupPhotoUrl: pendingGroup.group_photo,
  });

  if (!content) {
    throw new Error("Failed to create default content");
  }

  await repo.deletePendingGroup(id);

  await notifyPendingGroupDecisionFollowUp({
    pendingGroup,
    status,
    rejection_reason,
    decidedByUserId,
  });

  return {
    id,
    status,
    group_content_id: content.id,
    message: "Pending group approved and created successfully.",
  };
};

exports.updatePendingGroupStatus = async (req) => {
  if (!req.isSuperAdmin && req.user.role !== "Super_Admin") {
    throw { status: 403, message: "Access denied. Super Admins only." };
  }

  const { id } = req.params;
  const body = req.body || {};
  const status = normalizePendingGroupStatus(body.status);
  if (!status) {
    throw { status: 400, message: "Status must be approved or rejected" };
  }
  const rejection_reason =
    body.rejection_reason ?? body.rejectionReason ?? undefined;

  return processPendingGroupDecision({
    pendingGroupId: id,
    status,
    rejection_reason,
    decidedByUserId: req.user.id,
  });
};

exports.executePendingGroupFromEmail = async (token) => {
  const payload = verifyPendingGroupActionToken(token);

  const reviewer = await userRepository.findById(payload.reviewerId);
  if (!reviewer || reviewer.role !== "Super_Admin") {
    throw { status: 403, message: "This link is not valid for your account." };
  }

  const status = payload.action === "approve" ? "approved" : "rejected";
  const rejection_reason =
    status === "rejected" ? DEFAULT_EMAIL_REJECTION_REASON : undefined;

  return processPendingGroupDecision({
    pendingGroupId: payload.pendingGroupId,
    status,
    rejection_reason,
    decidedByUserId: payload.reviewerId,
  });
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
    if (updates.year !== undefined) {
      updates.year = normalizeGroupYear(updates.year);
    }
    if (updates.semester !== undefined) {
      updates.semester = normalizeGroupSemester(updates.semester);
    }
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

      if (!req.isSuperAdmin && user.group_admin_role === "OWNER") {
        results.push({
          email,
          success: false,
          message: "Cannot remove the group owner",
        });
        continue;
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
              message: "new_admin_id must be an Leader user",
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