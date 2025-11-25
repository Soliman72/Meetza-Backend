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
        const { group_name, position_id, group_content_id, description } =
          req.body;
        if (!group_name || !position_id) {
          return res
            .status(400)
            .json({ message: "group_name or position_id are required" });
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

        // Check if meeting content id exists
        if (group_content_id) {
          const checkGroupContentQuery =
            "SELECT * FROM meeting_content WHERE id = ?";
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
          "INSERT INTO `group` (id, group_name, position_id, administrator_id, description, group_photo , group_content_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
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
          ]);
        res.status(201).json({
          id,
          group_name,
          position_id,
          administrator_id,
          description,
          group_photo: group_photo_url,
          group_content_id,
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
    const { name } = req.query;
    let sql = "SELECT * FROM `group`";
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
        const { group_name, position_id, description, group_content_id } =
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
          !req.body.group_photo
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
        const sql = `UPDATE \`group\` SET 
        group_name = COALESCE(?, group_name), 
        position_id = COALESCE(?, position_id),
        description = COALESCE(?, description),
        group_photo = COALESCE(?, group_photo),
        group_content_id = COALESCE(?, group_content_id),
        WHERE id = ?`;
        const [result] = await db
          .promise()
          .query(sql, [
            group_name,
            position_id,
            description,
            group_photo_url,
            group_content_id,
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
