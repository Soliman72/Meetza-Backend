const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");

// Create
exports.createPosition = async (req, res) => {
  try {
    const { title, administrator_id } = req.body;

    let admin_id;
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "title and role are required" });
    }

    // Check if user is authenticated and has a valid id
    if (!(req.user && req.user.id !== undefined)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user is not authenticated",
      });
    }

    // check administrator role is Administrator or Super_Admin
    if (req.user.role === "Super_Admin") {
      if (!administrator_id) {
        return res
          .status(400)
          .json({ message: "administrator_id is required" });
      }
      admin_id = administrator_id;
    } else if (req.user.role === "Administrator") {
      admin_id = req.user.id;
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    // check administrator_id exists
    const [administratorRows] = await db
      .promise()
      .query("SELECT * FROM administrator WHERE user_id = ?", [admin_id]);
    if (administratorRows.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid administrator_id: not found" });
    }

    const id = uuidv4();

    const sql =
      "INSERT INTO `position` (id, title, administrator_id) VALUES (?, ?, ?)";
    await db.promise().query(sql, [id, title, admin_id]);
    res.status(201).json({ id: id, title, administrator_id: admin_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all
exports.getAllPositions = async (req, res) => {
  try {
    const { title } = req.query;
    let query = "SELECT * FROM position";
    let params = [];

    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(req, "administrator_id");

    if (ownershipFilter.whereClause != "") {
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    if (title) {
      query += ownershipFilter.whereClause ? " AND" : " WHERE";
      query += " title LIKE ?";
      params.push(`%${title}%`);
    }

    const [rows] = await db.promise().query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read by id
exports.getPositionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    let query = "SELECT * FROM position WHERE id = ?";
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
exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!id || !title) {
      return res
        .status(400)
        .json({ message: "id in params and title in body are required" });
    }
    const sql = "UPDATE position SET title = ? WHERE id = ?";
    const [result] = await db.promise().query(sql, [title, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json({ id, title });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    const sql = "DELETE FROM position WHERE id = ?";
    const [result] = await db.promise().query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
