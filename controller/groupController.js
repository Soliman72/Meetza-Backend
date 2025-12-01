const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");
const { upload, uploadToCloudinary } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");

// Create
exports.createGroup = async (req, res) => {
  upload.fields([{ name: "group_photo", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      try {
        const { group_name, position_id, group_content_id, description, year, semester } =
          req.body;
        if (!group_name || !position_id || !year || !semester) {
          return res
            .status(400)
            .json({ message: "group_name, position_id, year and semester are required" });
        }

        // check year is 1,2,3,4
        if (!["1", "2", "3", "4"].includes(year.toString())) {
          return res
            .status(400)
            .json({ message: "year must be 1, 2, 3, or 4" });
        }

        if (!["Fall", "Spring", "Summer"].includes(semester)) {
          return res
            .status(400)
            .json({ message: "semester must be Fall, Spring, or Summer" });
        }

        // Check if group content id exists
        if (group_content_id) {
          const checkGroupContentQuery =
            "SELECT * FROM group_content WHERE id = ?";
          const [results] = await db
            .promise()
            .query(checkGroupContentQuery, [group_content_id]);
          if (results.length === 0) {
            return res.status(400).json({
              success: false,
              message: "Invalid group_content_id: not found",
            });
          }
        }
        // Check if this group content is already used in another group
        if (group_content_id) {
          const [existingGroup] = await db
            .promise()
            .query(
              "SELECT * FROM `group` WHERE group_content_id = ?",
              [group_content_id]
            );
          if (existingGroup.length > 0) {
            return res.status(409).json({
              message:
                "This group_content_id is already associated with another group",
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
        // Chieck if position_id exists
        const [positionRows] = await db
          .promise()
          .query("SELECT * FROM position WHERE id = ?", [position_id]);
        if (positionRows.length === 0) {
          return res
            .status(400)
            .json({ message: "Invalid position_id: not found" });
        }
        // Check if user is authenticated and has a valid id
        if (req.user && req.user.id !== undefined) {
        } else {
          return res.status(401).json({
            success: false,
            message: "Unauthorized: administrator_id is required",
          });
        }

        // Check if group content id exists
        if (group_content_id) {
          const checkGroupContentQuery =
            "SELECT * FROM group_content WHERE id = ?";
          const [results] = await db
            .promise()
            .query(checkGroupContentQuery, [group_content_id]);

          if (results.length === 0) {
            return res.status(400).json({
              success: false,
              message: "Invalid group_content_id: not found",
            });
          }
        }

        // get administrator_id from position_id
        administrator_id = positionRows[0].administrator_id;

        const id = uuidv4();
        const sql =
          "INSERT INTO `group` (id, group_name, position_id, administrator_id, description, group_photo , group_content_id, year, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await db
          .promise()
          .query(sql, [
            id,
            group_name,
            position_id,
            administrator_id,
            description,
            group_photo_url,
            group_content_id,
            year,
            semester,
          ]);
          // Add administrator as member of the group
          const insertMembershipSql =
            "INSERT INTO group_membership (id, group_id, member_id, role) VALUES (?, ?, ?, ?)";
          const membershipId = uuidv4();
          await db.promise().query(insertMembershipSql, [
            membershipId,
            id,
            administrator_id,
            "Admin",
          ]);
        res.status(201).json({
          id,
          group_name,
          position_id,
          administrator_id,
          description,
          group_photo: group_photo_url,
          group_content_id,
          year,
          semester,
        });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  );
};

// Read all
exports.getAllGroups = async (req, res) => {
  try {
    const { name , year, semester} = req.query;

    // get all groups with admin info
    let sql = "SELECT `group`.*, user.name as admin_name, user.email as admin_email, user.user_photo as admin_photo FROM `group` JOIN user ON `group`.administrator_id = user.id";
    let params = [];



    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(req, "administrator_id");
    if (ownershipFilter.whereClause) {
      sql += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    if (name) {
      sql += ownershipFilter.whereClause ? " AND" : " WHERE";
      sql += " group_name LIKE ?";
      params.push(`%${name}%`);
    }

    if (year) {
      sql += ownershipFilter.whereClause || name ? " AND" : " WHERE";
      sql += " year = ?";
      params.push(year);
    }

    if (semester) {
      sql += ownershipFilter.whereClause || name || year ? " AND" : " WHERE";
      sql += " semester = ?";
      params.push(semester);
    }

    const [rows] = await db.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read by id
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    let query = "SELECT * FROM `group` WHERE id = ?";
    let params = [id];

    // Apply ownership filter for regular admins
    if (!req.isSuperAdmin) {
      query += " AND administrator_id = ?";
      params.push(req.administratorId);
    }

    const [rows] = await db.promise().query(query, params);
    if (rows.length === 0)
      return res.status(404).json({ message: "Record not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
exports.updateGroup = async (req, res) => {
  upload.fields([{ name: "group_photo", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      try {
        const { id } = req.params;
        const { group_name, position_id, description, group_content_id , year, semester} =
          req.body;
        if (!id) {
          return res.status(400).json({ message: "id is required" });
        }

        if (
          !position_id &&
          !group_name &&
          !description &&
          !req.files?.group_photo &&
          !group_content_id &&
          !req.body.group_photo&&
          !year&&
          !semester
        ) {
          return res
            .status(400)
            .json({ message: "At least one field to update is required" });
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

        const [existingGroup] = await db
          .promise()
          .query("SELECT * FROM `group` WHERE id = ?", [id]);
        if (existingGroup.length === 0) {
          return res.status(404).json({ message: "Group not found" });
        }

        // remove this group from previous group content if group_content_id is being updated
        if (group_content_id) {
          const [prevGroupContent] = existingGroup[0].group_content_id;
          if (prevGroupContent) {
            const clearPrevGroupContentSql =
              "UPDATE group_content SET group_id = null WHERE id = ?";
            await db
              .promise()
              .query(clearPrevGroupContentSql, [prevGroupContent]);
          }
        }

        // If position_id is being updated, check if it exists
        if (position_id) {
          const [positionRows] = await db
            .promise()
            .query("SELECT * FROM position WHERE id = ?", [position_id]);
          if (positionRows.length === 0) {
            return res
              .status(400)
              .json({ message: "Invalid position_id: not found" });
          }
        }
        
        // If group_content_id is being updated, check if it exists
        if (group_content_id) {
          const [groupContentRows] = await db
            .promise()
            .query("SELECT * FROM group_content WHERE id = ?", [group_content_id]);
          if (groupContentRows.length === 0) {
            return res
              .status(400)
              .json({ message: "Invalid group_content_id: not found" });
          }
        }

        const sql = `UPDATE \`group\` SET 
        group_name = COALESCE(?, group_name), 
        position_id = COALESCE(?, position_id),
        description = COALESCE(?, description),
        group_photo = COALESCE(?, group_photo),
        group_content_id = COALESCE(?, group_content_id),
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
            group_content_id,
            year,
            semester,
            id,
          ]);
        res.json({ message: "Group updated successfully" });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  );
};

// Delete
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    const sql = "DELETE FROM `group` WHERE id = ?";
    const [result] = await db.promise().query(sql, [id]);
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
