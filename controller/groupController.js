const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { upload, uploadToCloudinary } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");
const { createGroupContent } = require("./groupContentController");
const {
  isGroupAdmin,
  assignGroupAdmin,
  assignMeetingAdmin,
} = require("../utils/resourceAdminAccess");
const { ensureGroupAccess, GroupAccessError } = require("../utils/groupAccess");
const { attachAdminsToGroups, extractArray } = require("../services/groupService");

// Create
exports.createGroup = async (req, res) => {
  upload.fields([{ name: "group_photo", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      try {
        const {
          group_name,
          description,
          year,
          semester,
          group_content_name,
          group_content_description,
          administrator_id,
        } = req.body;
        if (
          !group_name ||
          !year ||
          !semester ||
          !group_content_name
        ) {
          return res.status(400).json({
            success: false,
            message:
              "group_name year, semester, and group_content_name are required fields",
          });
        }
        if (!["1", "2", "3", "4"].includes(year.toString())) {
          return res
            .status(400)
            .json({ success: false, message: "year must be 1, 2, 3, or 4" });
        }
        if (!["Fall", "Spring", "Summer"].includes(semester)) {
          return res.status(400).json({
            success: false,
            message: "semester must be Fall, Spring, or Summer",
          });
        }
        // Use the new extractArray utility to handle administrator_ids from various formats
        let inputIds = extractArray(req.body, "administrator_ids");

        // Also add the singular administrator_id if provided
        if (administrator_id) {
          inputIds.push(administrator_id.toString().trim());
        }

        // Resolve administrators to be assigned
        let adminIds = [];
        if (req.user.role === "Super_Admin") {
          adminIds = [...new Set(inputIds)];
          if (adminIds.length === 0) {
            return res.status(400).json({
              success: false,
              message: "at least one administrator_id or administrator_ids is required",
            });
          }
        } else if (req.user.role === "Administrator") {
          // Administrators are always added as an owner/admin of their own groups
          adminIds = [...new Set([req.user.id, ...inputIds])];
        } else {
          return res.status(403).json({
            success: false,
            message: "Only Administrators or Super_Admins can create groups",
          });
        }

        // Validate all admin IDs exist
        if (adminIds.length > 0) {
          const [validAdmins] = await db
            .promise()
            .query("SELECT user_id FROM administrator WHERE user_id IN (?)", [adminIds]);

          if (validAdmins.length !== adminIds.length) {
            return res.status(400).json({
              success: false,
              message: "One or more administrator IDs are invalid or not found",
            });
          }
        }
        let group_photo_url;
        if (req.files?.group_photo) {
          const group_photo = req.files.group_photo[0];

          // Validate file types BEFORE uploading
          validateFileType(group_photo, "image");

          // Upload files to Cloudinary
          group_photo_url = await uploadToCloudinary(group_photo, "posters");
        } else if (req.body?.group_photo) {
          // If URLs are provided in the body (from cloudinary)

          // Validate file types BEFORE uploading
          validateFileType(req.body.group_photo, "image");

          group_photo_url = req.body.group_photo; // Assuming it's a URL
        }

        const id = uuidv4();
        const sql =
          "INSERT INTO `group` (id, group_name, description, group_photo, year, semester) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await db
          .promise()
          .query(sql, [
            id,
            group_name,
            description,
            group_photo_url,
            year,
            semester,
          ]);

        // Assign administrators
        for (let i = 0; i < adminIds.length; i++) {
          await assignGroupAdmin({
            groupId: id,
            userId: adminIds[i],
            role: i === 0 ? "OWNER" : "ADMIN", // First ID is OWNER, others are ADMIN
            assignedBy: req.user.id,
          });
        }

        // Create group content if group_content_name is provided
        const content_body = {
          content_name: group_content_name,
          content_description: group_content_description || "",
          group_id: id,
        };
        const group_content = await createGroupContent(content_body, req);

        if (!group_content.success) {
          return res.status(500).json({
            success: false,
            message: `Failed to create group content ${group_content.message}`,
          });
        }
        res.status(201).json({
          success: true,
          data: {
            id,
            group_name,
            description,
            group_photo: group_photo_url,
            group_content_id: group_content.data.id,
            year,
            semester,
          },
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }
    },
  );
};

// Read all
exports.getAllGroups = async (req, res) => {
  try {
    const { name, year, semester } = req.query;

    // get all groups with admin info
    let sql =
      "SELECT g.* FROM `group` g LEFT JOIN group_admin ga ON ga.group_id = g.id";
    let params = [];
    let hasWhere = false;

    // Apply access filter for regular admins via group_admin table.
    // If it's an Administrator, they only see their groups. Members and Super_Admins see all groups.
    if (req.user.role === "Administrator") {
      sql += hasWhere ? " AND" : " WHERE";
      hasWhere = true;
      sql += " ga.user_id = ?";
      params.push(req.user.id);
    }

    if (name) {
      sql += hasWhere ? " AND" : " WHERE";
      hasWhere = true;
      sql += " group_name LIKE ?";
      params.push(`%${name}%`);
    }

    // Allow multiple years (comma or array in querystring)
    let yearsArray = [];
    if (year) {
      if (Array.isArray(year)) {
        yearsArray = year.filter((y) => !!y);
      } else if (typeof year === "string") {
        yearsArray = year
          .split(",")
          .map((y) => y.trim())
          .filter((y) => !!y);
      }
    }
    if (yearsArray.length > 0) {
      sql += hasWhere ? " AND" : " WHERE";
      hasWhere = true;
      sql += ` year IN (${yearsArray.map(() => "?").join(",")})`;
      params.push(...yearsArray);
    }

    // Allow multiple semesters (comma or array in querystring)
    let semestersArray = [];
    if (semester) {
      if (Array.isArray(semester)) {
        semestersArray = semester.filter((s) => !!s);
      } else if (typeof semester === "string") {
        semestersArray = semester
          .split(",")
          .map((s) => s.trim())
          .filter((s) => !!s);
      }
    }
    if (semestersArray.length > 0) {
      sql += hasWhere ? " AND" : " WHERE";
      hasWhere = true;
      sql += ` semester IN (${semestersArray.map(() => "?").join(",")})`;
      params.push(...semestersArray);
    }

    const [rows] = await db.promise().query(sql, params);
    const groupsWithAdmins = await attachAdminsToGroups(rows);
    res.status(200).json({ success: true, data: groupsWithAdmins });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Read by id
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "id is required" });
    }
    let query = "SELECT * FROM `group` WHERE id = ?";
    const params = [id];
    const [rows] = await db.promise().query(query, params);
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    if (!req.isSuperAdmin) {
      const allowed = await isGroupAdmin(req.user.id, id);
      if (!allowed) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied to this group" });
      }
    }
    const groupsWithAdmins = await attachAdminsToGroups([rows[0]]);
    res.status(200).json({ success: true, data: groupsWithAdmins[0] });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Update
exports.updateGroup = async (req, res) => {
  upload.fields([{ name: "group_photo", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      try {
        const { id } = req.params;
        const { group_name, description, year, semester } =
          req.body;
        if (!id) {
          return res
            .status(400)
            .json({ success: false, message: "id is required" });
        }
        if (
          !group_name &&
          !description &&
          !req.files?.group_photo &&
          !req.body?.group_photo &&
          !year &&
          !semester
        ) {
          return res.status(400).json({
            success: false,
            message: "At least one field to update is required",
          });
        }
        const checkGroupQuery = "SELECT * FROM `group` WHERE id = ?";
        const [groupRows] = await db.promise().query(checkGroupQuery, [id]);
        if (groupRows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Group not found with the provided id",
          });
        }
        if (!req.isSuperAdmin) {
          const allowed = await isGroupAdmin(req.user.id, id);
          if (!allowed) {
            return res.status(403).json({
              success: false,
              message: "Only group admins can update this group",
            });
          }
        }
        if (year && !["1", "2", "3", "4"].includes(year.toString())) {
          return res
            .status(400)
            .json({ success: false, message: "year must be 1, 2, 3, or 4" });
        }
        if (semester && !["Fall", "Spring", "Summer"].includes(semester)) {
          return res.status(400).json({
            success: false,
            message: "semester must be Fall, Spring, or Summer",
          });
        }

        let group_photo_url;
        if (req.files?.group_photo) {
          const group_photo = req.files.group_photo[0];
          // Validate file types BEFORE uploading
          validateFileType(group_photo, "image");
          // Upload files to Cloudinary
          group_photo_url = await uploadToCloudinary(group_photo, "posters");
        } else if (req.body?.group_photo) {
          // If URLs are provided in the body (from cloudinary)
          // Validate file types BEFORE uploading
          validateFileType(req.body.group_photo, "image");
          group_photo_url = req.body.group_photo; // Assuming it's a URL
        }

        const sql = `UPDATE \`group\` SET 
        group_name = COALESCE(?, group_name), 
        description = COALESCE(?, description),
        group_photo = COALESCE(?, group_photo),
        year = COALESCE(?, year),
        semester = COALESCE(?, semester)
        WHERE id = ?`;
        const [result] = await db
          .promise()
          .query(sql, [
            group_name,
            description,
            group_photo_url,
            year,
            semester,
            id,
          ]);
        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Group not found" });
        }
        res
          .status(200)
          .json({ success: true, message: "Group updated successfully" });
      } catch (err) {
        res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }
    },
  );
};

// Delete
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "id is required" });
    }
    if (!req.isSuperAdmin) {
      const allowed = await isGroupAdmin(req.user.id, id);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Only group admins can delete this group",
        });
      }
    }
    const sql = "DELETE FROM `group` WHERE id = ?";
    await db.promise().query(sql, [id]);
    res
      .status(200)
      .json({ success: true, message: "Group deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

exports.addGroupAdmin = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { email, emails, role = "ADMIN" } = req.body;

    // Support both single email and array of emails (potentially from indexed form-data keys or formatted strings)
    let targetEmails = extractArray(req.body, "emails");
    if (email) targetEmails.push(email.toString().trim());
    targetEmails = [...new Set(targetEmails)];

    if (targetEmails.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one email is required" });
    }

    if (!["OWNER", "ADMIN"].includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "role must be OWNER or ADMIN" });
    }

    if (!req.isSuperAdmin) {
      const allowed = await isGroupAdmin(req.user.id, groupId);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Only group admins can add admins",
        });
      }
    }

    const [groupRows] = await db
      .promise()
      .query("SELECT id FROM `group` WHERE id = ?", [groupId]);
    if (groupRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const results = [];
    const [meetings] = await db
      .promise()
      .query("SELECT id FROM meeting WHERE group_id = ?", [groupId]);

    for (const emailAddr of targetEmails) {
      try {
        const [targetUserRows] = await db
          .promise()
          .query("SELECT id, role FROM user WHERE email = ? LIMIT 1", [emailAddr]);

        if (targetUserRows.length === 0) {
          results.push({ email: emailAddr, success: false, message: "User not found" });
          continue;
        }

        if (targetUserRows[0].role !== "Administrator") {
          results.push({ email: emailAddr, success: false, message: "User is not an Administrator" });
          continue;
        }

        const targetUserId = targetUserRows[0].id;

        await assignGroupAdmin({
          groupId,
          userId: targetUserId,
          role,
          assignedBy: req.user.id,
        });

        // Sync with meetings
        await Promise.all(
          meetings.map((meeting) =>
            assignMeetingAdmin({
              meetingId: meeting.id,
              userId: targetUserId,
              role,
              assignedBy: req.user.id,
            }),
          ),
        );

        results.push({ email: emailAddr, success: true });
      } catch (innerErr) {
        results.push({ email: emailAddr, success: false, message: innerErr.message });
      }
    }

    const allSuccessful = results.every(r => r.success);
    return res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      message: allSuccessful ? "All group admins added successfully" : "Some admins could not be added",
      data: results,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

exports.removeGroupAdmin = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { email, emails } = req.body;

    // Support both single email and array of emails (potentially from indexed form-data keys or formatted strings)
    let targetEmails = extractArray(req.body, "emails");
    if (email) targetEmails.push(email.toString().trim());
    targetEmails = [...new Set(targetEmails)];

    if (targetEmails.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one email is required" });
    }

    if (!req.isSuperAdmin) {
      const allowed = await isGroupAdmin(req.user.id, groupId);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Only group admins can remove admins",
        });
      }
    }

    const results = [];

    for (const emailAddr of targetEmails) {
      try {
        const [targetByUser] = await db.promise().query(
          `SELECT ga.user_id, ga.role, u.email
             FROM group_admin ga
             JOIN user u ON u.id = ga.user_id
             WHERE ga.group_id = ? AND u.email = ? LIMIT 1`,
          [groupId, emailAddr],
        );

        if (targetByUser.length === 0) {
          results.push({ email: emailAddr, success: false, message: "Admin not found for this group" });
          continue;
        }

        const targetRecord = targetByUser[0];

        if (targetRecord.role === "OWNER") {
          const [owners] = await db
            .promise()
            .query(
              "SELECT id FROM group_admin WHERE group_id = ? AND role = 'OWNER'",
              [groupId],
            );

          if (owners.length <= 1) {
            results.push({ email: emailAddr, success: false, message: "Cannot remove the last group owner" });
            continue;
          }
        }

        await db
          .promise()
          .query("DELETE FROM group_admin WHERE group_id = ? AND user_id = ?", [
            groupId,
            targetRecord.user_id,
          ]);

        // Revoke meeting admin rights
        await db.promise().query(
          `DELETE ma FROM meeting_admin ma
           JOIN meeting m ON m.id = ma.meeting_id
           WHERE m.group_id = ? AND ma.user_id = ?`,
          [groupId, targetRecord.user_id],
        );

        results.push({ email: emailAddr, success: true });
      } catch (innerErr) {
        results.push({ email: emailAddr, success: false, message: innerErr.message });
      }
    }

    const anySuccessful = results.some(r => r.success);
    return res.status(anySuccessful ? 200 : 400).json({
      success: anySuccessful,
      message: anySuccessful ? "Operation completed" : "No admins were removed",
      data: results,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

// Leave group (member or admin). If the caller is the last admin, they must assign a new admin before leaving.
// POST /api/group/:id/leave  body: { new_admin_id?: string, new_admin_role?: 'OWNER'|'ADMIN' }
exports.leaveGroup = async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user?.id;
  if (!userId || !groupId) {
    return res.status(400).json({
      success: false,
      message: "group id is required and user must be authenticated",
    });
  }

  const { new_admin_id, new_admin_role } = req.body || {};

  const conn = await db.promise().getConnection();
  try {
    // Ensure user has access to the group (admin or member). Gives clearer errors.
    try {
      await ensureGroupAccess(userId, groupId);
    } catch (e) {
      if (e instanceof GroupAccessError) {
        return res
          .status(e.statusCode)
          .json({ success: false, message: e.message });
      }
      throw e;
    }

    // Determine if user is a group admin
    const [myAdminRows] = await conn.query(
      "SELECT role FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
      [groupId, userId],
    );
    const isAdmin = myAdminRows.length > 0;
    const myAdminRole = isAdmin ? myAdminRows[0].role : null;

    // If admin, enforce last-admin rule
    if (isAdmin) {
      const [otherAdminsCountRows] = await conn.query(
        "SELECT COUNT(*) AS c FROM group_admin WHERE group_id = ? AND user_id <> ?",
        [groupId, userId],
      );
      const otherAdmins = Number(otherAdminsCountRows[0]?.c) || 0;

      if (otherAdmins === 0) {
        if (!new_admin_id) {
          // Only platform Administrators (same rule as addGroupAdmin), excluding self
          const [admins] = await conn.query(
            `SELECT u.id, u.name, u.user_photo
             FROM administrator a
             INNER JOIN user u ON u.id = a.user_id
             WHERE u.id <> ?
               AND u.role = 'Administrator'
             ORDER BY u.name ASC
             LIMIT 50`,
            [userId],
          );

          return res.status(409).json({
            success: false,
            code: "LAST_ADMIN_ASSIGN_REQUIRED",
            message:
              "You are the last admin in this group. Assign a new admin before leaving.",
            data: {
              group_id: groupId,
              current_admin_role: myAdminRole,
              admins,
            },
          });
        }

        // Must be in administrator table AND user.role = Administrator (not Super_Admin / Member)
        const [validAdmin] = await conn.query(
          `SELECT a.user_id
           FROM administrator a
           INNER JOIN user u ON u.id = a.user_id
           WHERE a.user_id = ? AND u.role = 'Administrator'
           LIMIT 1`,
          [new_admin_id],
        );
        if (validAdmin.length === 0) {
          return res.status(400).json({
            success: false,
            message: "new_admin_id must be an Administrator user",
          });
        }

        const roleToAssign =
          new_admin_role && ["OWNER", "ADMIN"].includes(new_admin_role)
            ? new_admin_role
            : myAdminRole === "OWNER"
              ? "OWNER"
              : "ADMIN";

        await conn.beginTransaction();

        // Assign new admin
        await conn.query(
          `INSERT INTO group_admin (id, group_id, user_id, role, assigned_by)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
          [uuidv4(), groupId, new_admin_id, roleToAssign, userId],
        );

        // Sync meeting admin rights for all meetings in this group
        const [meetingIds] = await conn.query(
          "SELECT id FROM meeting WHERE group_id = ?",
          [groupId],
        );
        for (const m of meetingIds) {
          await conn.query(
            `INSERT INTO meeting_admin (id, meeting_id, user_id, role, assigned_by)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
            [uuidv4(), m.id, new_admin_id, roleToAssign, userId],
          );
        }

        // Remove current admin
        await conn.query("DELETE FROM group_admin WHERE group_id = ? AND user_id = ?", [
          groupId,
          userId,
        ]);
        await conn.query(
          `DELETE ma FROM meeting_admin ma
           JOIN meeting m ON m.id = ma.meeting_id
           WHERE m.group_id = ? AND ma.user_id = ?`,
          [groupId, userId],
        );

        // Remove membership if exists (some setups might add admins as members too)
        await conn.query(
          "DELETE FROM group_membership WHERE group_id = ? AND member_id = ?",
          [groupId, userId],
        );

        await conn.commit();

        return res.status(200).json({
          success: true,
          message: "Left group successfully",
          data: {
            group_id: groupId,
            assigned_new_admin: { id: new_admin_id, role: roleToAssign },
          },
        });
      }
    }

    // Normal leave (not last admin): remove membership and/or admin record
    await conn.beginTransaction();
    await conn.query("DELETE FROM group_membership WHERE group_id = ? AND member_id = ?", [
      groupId,
      userId,
    ]);
    await conn.query("DELETE FROM group_admin WHERE group_id = ? AND user_id = ?", [
      groupId,
      userId,
    ]);
    await conn.query(
      `DELETE ma FROM meeting_admin ma
       JOIN meeting m ON m.id = ma.meeting_id
       WHERE m.group_id = ? AND ma.user_id = ?`,
      [groupId, userId],
    );
    await conn.commit();

    return res.status(200).json({
      success: true,
      message: "Left group successfully",
      data: { group_id: groupId },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_e) {}
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  } finally {
    conn.release();
  }
};
