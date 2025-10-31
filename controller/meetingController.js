const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

// Create a meeting
exports.createMeeting = (req, res) => {
  const { title, datetime, meeting_content_id, status } = req.body;
  const id = uuidv4();

  // Validate required fields
  if (!title || !datetime || !meeting_content_id || !status) {
    return res.status(400).json({
      success: false,
      message: "title, datetime, meeting_content_id and status are required",
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
      message: "status must be one of: Scheduled, Completed, Cancelled",
    });
  }

  // Check if meeting content id exists
  const checkMeetingContentQuery = "SELECT * FROM meeting_content WHERE id = ?";
  db.query(checkMeetingContentQuery, [meeting_content_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }

    // If meeting content is not found
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting_content_id: not found",
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
    const query = `INSERT INTO meeting (id, title, datetime, meeting_content_id, status , administrator_id)
                  VALUES (?, ?, ?, ?, ? , ?)`;

    db.query(
      query,
      [
        id,
        title,
        datetime,
        meeting_content_id,
        status,
        req.body.administrator_id,
      ],
      (err, result) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        // Return response after meeting is created successfully
        return res.status(201).json({
          success: true,
          message: "Meeting created successfully",
          data: {
            id,
            title,
            datetime,
            meeting_content_id,
            status,
          },
        });
      }
    );
  });
};

// Get all meetings
exports.getAllMeetings = (req, res) => {
  const query = "SELECT * FROM meeting";
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

// Get a meeting by id
exports.getMeetingById = (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "meeting id is required",
    });
  }
  const query = "SELECT * FROM meeting WHERE id = ?";
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
        message: "Meeting not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: results[0],
    });
  });
};

// Update a meeting by id
exports.updateMeetingById = (req, res) => {
  const { id } = req.params;
  const { title, datetime, meeting_content_id, status } = req.body;

  if (!id || !title || !datetime || !meeting_content_id || !status) {
    return res.status(400).json({
      success: false,
      message:
        "id, title, datetime, meeting_content_id and status are required",
    });
  }

  const query =
    "UPDATE meeting SET title = ?, datetime = ?, meeting_content_id = ?, status = ? WHERE id = ?";
  db.query(
    query,
    [title, datetime, meeting_content_id, status, id],
    (err, result) => {
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
          message: "Meeting not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Meeting updated successfully",
      });
    }
  );
};

// Delete a meeting by id
exports.deleteMeetingById = (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "meeting id is required",
    });
  }
  const query = "DELETE FROM meeting WHERE id = ?";
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
        message: "Meeting not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  });
};
