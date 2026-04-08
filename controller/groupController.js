const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { upload, uploadToCloudinary } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");
const { createGroupContent } = require("./groupContentController");
const {
  isGroupAdmin,
  assignGroupAdmin,
} = require("../utils/resourceAdminAccess");

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
          position_id,
          description,
          year,
          semester,
          group_content_name,
          group_content_description,
        } = req.body;
        if (
          !group_name ||
          !position_id ||
          !year ||
          !semester ||
          !group_content_name
        ) {
          return res.status(400).json({
            success: false,
            message:
              "group_name, position_id, year, semester, and group_content_name are required fields",
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
        const [positionRows] = await db
          .promise()
          .query("SELECT * FROM `position` WHERE id = ?", [position_id]);
        if (positionRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid position_id: not found",
          });
        }

        // get administrator_id from position_id
        let administrator_id = positionRows[0].administrator_id;

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
          "INSERT INTO `group` (id, group_name, position_id, administrator_id, description, group_photo, year, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await db
          .promise()
          .query(sql, [
            id,
            group_name,
            position_id,
            administrator_id,
            description,
            group_photo_url,
            year,
            semester,
          ]);

        await assignGroupAdmin({
          groupId: id,
          userId: req.user.id,
          role: "OWNER",
          assignedBy: req.user.id,
        });

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
            position_id,
            administrator_id,
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
      "SELECT g.*, u.name as admin_name, u.email as admin_email, u.user_photo as admin_photo FROM `group` g LEFT JOIN user u ON g.administrator_id = u.id";
    let params = [];
    let hasWhere = false;

    // Apply access filter for regular admins via group_admin table
    if (req.user.role !== "Super_Admin") {
      sql +=
        " JOIN group_admin ga_access ON ga_access.group_id = g.id AND ga_access.user_id = ?";
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
    res.status(200).json({ success: true, data: rows });
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
    res.status(200).json({ success: true, data: rows[0] });
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
        const { group_name, position_id, description, year, semester } =
          req.body;
        if (!id) {
          return res
            .status(400)
            .json({ success: false, message: "id is required" });
        }
        if (
          !position_id &&
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
        if (position_id) {
          const [positionRows] = await db
            .promise()
            .query("SELECT * FROM position WHERE id = ?", [position_id]);
          if (positionRows.length === 0) {
            return res.status(400).json({
              success: false,
              message: "Invalid position_id: not found",
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

        const sql = `UPDATE \`group\` SET 
        group_name = COALESCE(?, group_name), 
        position_id = COALESCE(?, position_id),
        description = COALESCE(?, description),
        group_photo = COALESCE(?, group_photo),
        year = COALESCE(?, year),
        semester = COALESCE(?, semester)
        WHERE id = ?`;
        const [result] = await db
          .promise()
          .query(sql, [
            group_name,
            position_id,
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

exports.getGroupAdmins = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    if (!req.isSuperAdmin) {
      const allowed = await isGroupAdmin(req.user.id, groupId);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Only group admins can view group admins",
        });
      }
    }
    const [rows] = await db.promise().query(
      `SELECT ga.id, ga.group_id, ga.user_id, ga.role, ga.assigned_by, ga.created_at,
              u.name, u.email, u.user_photo
       FROM group_admin ga
       JOIN user u ON u.id = ga.user_id
       WHERE ga.group_id = ?
       ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC`,
      [groupId],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

exports.addGroupAdmin = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { user_id, role = "ADMIN" } = req.body;
    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
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

    const [targetUserRows] = await db
      .promise()
      .query("SELECT id FROM user WHERE id = ? LIMIT 1", [user_id]);
    if (targetUserRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "user_id must be a valid user.id from user table",
      });
    }
    const [assignedByRows] = await db
      .promise()
      .query("SELECT id FROM user WHERE id = ? LIMIT 1", [req.user.id]);
    if (assignedByRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Authenticated requester is invalid",
      });
    }

    await assignGroupAdmin({
      groupId,
      userId: user_id,
      role,
      assignedBy: req.user.id,
    });
    return res
      .status(200)
      .json({ success: true, message: "Group admin upserted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};

exports.removeGroupAdmin = async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;
    if (!req.isSuperAdmin) {
      const allowed = await isGroupAdmin(req.user.id, groupId);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Only group admins can remove admins",
        });
      }
    }

    const [owners] = await db
      .promise()
      .query(
        "SELECT id FROM group_admin WHERE group_id = ? AND role = 'OWNER'",
        [groupId],
      );
    // Accept either target user_id or group_admin.id in path param.
    const [targetByUser] = await db
      .promise()
      .query(
        "SELECT id, user_id, role FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
        [groupId, userId],
      );
    let targetRecord = targetByUser[0];
    if (!targetRecord) {
      const [targetByAdminRowId] = await db
        .promise()
        .query(
          "SELECT id, user_id, role FROM group_admin WHERE group_id = ? AND id = ? LIMIT 1",
          [groupId, userId],
        );
      targetRecord = targetByAdminRowId[0];
    }
    if (!targetRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Group admin not found. Use target user_id (user.id) or group_admin.id.",
      });
    }
    if (targetRecord.role === "OWNER" && owners.length <= 1) {
      return res.status(409).json({
        success: false,
        message: "Cannot remove the last group owner",
      });
    }

    await db
      .promise()
      .query("DELETE FROM group_admin WHERE group_id = ? AND user_id = ?", [
        groupId,
        targetRecord.user_id,
      ]);
    // Cascade: losing group admin removes meeting admin rights in all meetings of the group.
    await db.promise().query(
      `DELETE ma FROM meeting_admin ma
       JOIN meeting m ON m.id = ma.meeting_id
       WHERE m.group_id = ? AND ma.user_id = ?`,
      [groupId, targetRecord.user_id],
    );

    return res.status(200).json({
      success: true,
      message: "Group admin removed and meeting admin rights revoked",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  }
};
