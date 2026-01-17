const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");
const { upload, uploadToCloudinary } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");
const { createGroupContent } = require("./groupContentController");
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
        const {
          group_name,
          position_id,
          description,
          year,
          semester,
          group_content_name,
          group_content_description,
        } = req.body;
        if (!group_name || !position_id || !year || !semester || !group_content_name) {
          return res
            .status(400)
            .json({
              message:
                "group_name, position_id, year, semester, and group_content_name are required fields",
            });
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

        // Chieck if position_id exists
        const [positionRows] = await db
          .promise()
          .query("SELECT * FROM `position` WHERE id = ?", [position_id]);
          
        if (positionRows.length === 0) {
          return res
            .status(400)
            .json({ message: "Invalid position_id: not found" });
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
          
          // Create group content if group_content_name is provided
        const content_body = {
          content_name: group_content_name,
          content_description: group_content_description || "",
          group_id: id,
        };
        const group_content = await createGroupContent (content_body, req);

        if(!group_content.success){
          return res.status(500).json({ message: `Failed to create group content ${group_content.message}` });
        }

        res.status(201).json({
          id,
          group_name,
          position_id,
          administrator_id,
          description,
          group_photo: group_photo_url,
          group_content_id: group_content.data.id,
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
    const { name, year, semester } = req.query;

    // get all groups with admin info
    let sql =
      "SELECT `group`.*, user.name as admin_name, user.email as admin_email, user.user_photo as admin_photo FROM `group` JOIN user ON `group`.administrator_id = user.id";
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

    // Allow multiple years (comma or array in querystring)
    let yearsArray = [];
    if (year) {
      if (Array.isArray(year)) {
        yearsArray = year.filter(y => !!y);
      } else if (typeof year === "string") {
        yearsArray = year.split(",").map(y => y.trim()).filter(y => !!y);
      }
    }
    if (yearsArray.length > 0) {
      sql += (ownershipFilter.whereClause || name) ? " AND" : " WHERE";
      sql += ` year IN (${yearsArray.map(() => "?").join(",")})`;
      params.push(...yearsArray);
    }

    // Allow multiple semesters (comma or array in querystring)
    let semestersArray = [];
    if (semester) {
      if (Array.isArray(semester)) {
        semestersArray = semester.filter(s => !!s);
      } else if (typeof semester === "string") {
        semestersArray = semester.split(",").map(s => s.trim()).filter(s => !!s);
      }
    }
    if (semestersArray.length > 0) {
      sql += (ownershipFilter.whereClause || name || yearsArray.length > 0) ? " AND" : " WHERE";
      sql += ` semester IN (${semestersArray.map(() => "?").join(",")})`;
      params.push(...semestersArray);
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
        const {
          group_name,
          position_id,
          description,
          year,
          semester,
        } = req.body;
        if (!id) {
          return res.status(400).json({ message: "id is required" });
        }

        if (
          !position_id &&
          !group_name &&
          !description &&
          !req.files?.group_photo &&
          !req.body.group_photo &&
          !year &&
          !semester
        ) {
          return res
            .status(400)
            .json({ message: "At least one field to update is required" });
        }

        // Check if group exists
        const checkGroupQuery = "SELECT * FROM `group` WHERE id = ?";
        const [groupRows] = await db.promise().query(checkGroupQuery, [id]);
        if (groupRows.length === 0) {
          return res
            .status(404)
            .json({ message: "Group not found with the provided id" });
        }

        // Check year is 1,2,3,4
        if (year && !["1", "2", "3", "4"].includes(year.toString())) {
          return res
            .status(400)
            .json({ message: "year must be 1, 2, 3, or 4" });
        }
        if (semester && !["Fall", "Spring", "Summer"].includes(semester)) {
          return res
            .status(400)
            .json({ message: "semester must be Fall, Spring, or Summer" });
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
            return res.status(404).json({ message: "Group not found" });
          }
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
