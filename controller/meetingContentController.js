const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");

// Controller to handle meeting content creation
exports.createMeetingContent = async (req, res) => {
  try {
    const { content_name, content_description } = req.body;
    const id = uuidv4();

    if (!content_name || !content_description) {
      return res.status(400).json({
        success: false,
        message: "Content name and description are required",
      });
    }

    const query =
      "INSERT INTO meeting_content (id, content_name, content_description) VALUES (?, ?, ?)";
    await db.promise().query(query, [id, content_name, content_description]);

    return res.status(201).json({
      success: true,
      message: "Meeting content created successfully",
      data: { id, content_name, content_description },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to get all meeting contents
exports.getAllMeetingContents = async (req, res) => {
  try {
    const { name } = req.query;
    let query =
      "SELECT meeting_content.id , meeting_content.content_name , meeting_content.content_description FROM meeting_content";
    let params = [];

    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(req, "meeting.administrator_id");

    if (ownershipFilter.whereClause) {
      query +=
        " JOIN meeting ON meeting.meeting_content_id = meeting_content.id";
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    if (name) {
      query += " AND content_name LIKE ?";
      params.push(`%${name}%`);
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

// Controller to get a specific meeting content by ID
exports.getMeetingContentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Content id is required",
      });
    }

    const query = "SELECT * FROM meeting_content WHERE id = ?";
    const [results] = await db.promise().query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting content not found",
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

// Controller to update meeting content by ID
exports.updateMeetingContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { content_name, content_description } = req.body;

    if (!id || !content_name || !content_description) {
      return res.status(400).json({
        success: false,
        message: "Content id, name, and description are required",
      });
    }

    const query =
      "UPDATE meeting_content SET content_name = ?, content_description = ? WHERE id = ?";
    const [result] = await db
      .promise()
      .query(query, [content_name, content_description, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting content not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Meeting content updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

// Controller to delete a specific meeting content by ID
exports.deleteMeetingContentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Content id is required",
      });
    }

    const query = "DELETE FROM meeting_content WHERE id = ?";
    const [result] = await db.promise().query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting content not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Meeting content deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};
