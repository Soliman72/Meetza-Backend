const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

// Create a meeting
exports.createMeeting = async (req, res) => {
  try {
    const { title, datetime, group_id, meeting_content_id, status } = req.body;
    const id = uuidv4();

    // Validate required fields
    if (!title || !datetime || !meeting_content_id || !group_id || !status) {
      return res.status(400).json({
        success: false,
        message:
          "Title, datetime, meeting_content_id,group_id , and status are required",
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

    // Check if meeting content id exists
    const checkMeetingContentQuery =
      "SELECT * FROM meeting_content WHERE id = ?";
    const [results] = await db
      .promise()
      .query(checkMeetingContentQuery, [meeting_content_id]);

    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting_content_id: not found",
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
    const query = `INSERT INTO meeting (id, title, datetime, meeting_content_id, status, administrator_id , group_id) 
                    VALUES (?, ?, ?, ?, ?, ? , ?)`;
    await db
      .promise()
      .query(query, [
        id,
        title,
        datetime,
        meeting_content_id,
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
        meeting_content_id,
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
    const query = "SELECT * FROM meeting";
    const [results] = await db.promise().query(query);

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

    const query = "SELECT * FROM meeting WHERE id = ?";
    const [results] = await db.promise().query(query, [id]);

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
    const { title, datetime, meeting_content_id, group_id, status } = req.body;

    if (
      !id ||
      !title ||
      !datetime ||
      !meeting_content_id ||
      !group_id ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message:
          "id, title, datetime, meeting_content_id , group_id and status are required",
      });
    }

    const query =
      "UPDATE meeting SET title = ?, datetime = ?, meeting_content_id = ?, status = ? , group_id =?  WHERE id = ?";
    const [result] = await db
      .promise()
      .query(query, [
        title,
        datetime,
        meeting_content_id,
        status,
        group_id,
        id,
      ]);

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
