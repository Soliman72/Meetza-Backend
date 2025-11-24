const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");

// Create a meeting
exports.createMeeting = async (req, res) => {
  try {
    const { title, datetime, group_id, status } = req.body;
    const id = uuidv4();

    // Validate required fields
    if (!title || !datetime || !group_id || !status) {
      return res.status(400).json({
        success: false,
        message: "Title, datetime,group_id , and status are required",
      });
    }

    // Validate status value
    if (
      status !== "Scheduled" &&
      status !== "Completed" &&
      status !== "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: Scheduled, Completed, Cancelled",
      });
    }

    const checkGroupQuery = "SELECT * FROM `group` WHERE id = ?";
    const [groupResults] = await db
      .promise()
      .query(checkGroupQuery, [group_id]);
    if (groupResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid group_id: not found",
      });
    }

    // Check if user is authenticated and has a valid id
    if (req.user && req.user.id !== undefined) {
      req.body.administrator_id = req.user.id;
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: administrator_id is required",
      });
    }

    // Insert the meeting into the database
    const query = `INSERT INTO meeting (id, title, datetime, status, administrator_id , group_id) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
    await db
      .promise()
      .query(query, [
        id,
        title,
        datetime,
        status,
        req.body.administrator_id,
        group_id,
      ]);

    return res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data: {
        id,
        title,
        datetime,
        group_id,
        status,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Get all meetings
exports.getAllMeetings = async (req, res) => {
  try {
    const { title } = req.query;
    let query = "SELECT * FROM meeting";
    let params = [];

    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(req, "administrator_id");
    if (ownershipFilter.whereClause) {
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    if (title) {
      query += ownershipFilter.whereClause ? " AND" : " WHERE";
      query += " title LIKE ?";
      params.push(`%${title}%`);
    }

    const [results] = await db.promise().query(query, params);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Get a meeting by id
exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Meeting id is required",
      });
    }

    let query = "SELECT * FROM meeting WHERE id = ?";
    let params = [id];

    // Apply ownership filter for regular admins
    if (!req.isSuperAdmin) {
      query += " AND administrator_id = ?";
      params.push(req.administratorId);
    }

    const [results] = await db.promise().query(query, params);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Update a meeting by id
exports.updateMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, datetime, group_id, status } = req.body;

    if (!id || !title || !datetime || !group_id || !status) {
      return res.status(400).json({
        success: false,
        message: "id, title, datetime , group_id and status are required",
      });
    }

    const query =
      "UPDATE meeting SET title = ?, datetime = ?, status = ? , group_id =?  WHERE id = ?";
    const [result] = await db
      .promise()
      .query(query, [title, datetime, status, group_id, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Delete a meeting by id
exports.deleteMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Meeting id is required",
      });
    }

    const query = "DELETE FROM meeting WHERE id = ?";
    const [result] = await db.promise().query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};
