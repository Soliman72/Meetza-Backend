const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

// Controller to handle meeting content creation
exports.createMeetingContent = (req, res) => {
  const { content_name, content_description } = req.body;
  const id = uuidv4();
  // const userId = req.user.id;
  if (!content_name || !content_description) {
    return res.status(400).json({
      success: false,
      message: "Content name and description are required",
    });
  }
  const query =
    "INSERT INTO meeting_content (id, content_name, content_description) VALUES (?, ?, ?)";
  db.query(query, [id, content_name, content_description], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    return res.status(201).json({
      success: true,
      message: "Meeting content created successfully",
      data: { id, content_name, content_description },
    });
  });
};

// Controller to get all meeting contents
exports.getAllMeetingContents = (req, res) => {
  const query = "SELECT * FROM meeting_content";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    return res.status(200).json({
      success: true,
      data: results,
    });
  });
};

// Controller to get a specific meeting content by ID
exports.getMeetingContentById = (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "content id are required",
    });
  }
  const query = "SELECT * FROM meeting_content WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
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
  });
};

exports.updateMeetingContentById = (req, res) => {
  const { id } = req.params;
  const { content_name, content_description } = req.body;
  if (!id || !content_name || !content_description) {
    return res.status(400).json({
      success: false,
      message: "content id are required",
    });
  }
  const query =
    "UPDATE meeting_content SET content_name = ?, content_description = ? WHERE id = ?";
  db.query(query, [content_name, content_description, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
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
  });
};

// Controller to delete a specific meeting content by ID
exports.deleteMeetingContentById = (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "content id are required",
    });
  }
  const query = "DELETE FROM meeting_content WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
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
  });
};
