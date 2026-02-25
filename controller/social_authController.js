const db = require('../config/db');
const { v4: uuidv4 } = require("uuid");

// Create
exports.createSocialAuth = async (data) => {
  try {
    const { user_id, provider, provider_id } = data;

    if (!user_id || !provider || !provider_id) {
      throw new Error("user_id, provider, and provider_id are required");
    }

    const id = uuidv4();
    const sql = 'INSERT INTO social_auth (id, user_id, provider, provider_id) VALUES (?, ?, ?, ?)';
    await db.promise().query(sql, [id, user_id, provider, provider_id]);

    return { id, user_id, provider, provider_id };
  } catch (err) {
    throw err;
  }
};


// Read all
exports.getAllSocialAuths = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM social_auth');
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Read by id
exports.getSocialAuthById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    const [rows] = await db.promise().query('SELECT * FROM social_auth WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Update
exports.updateSocialAuth = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { provider, provider_id } = req.body;
    if (!user_id || !provider || !provider_id) {
      return res.status(400).json({ success: false, message: "user_id, provider, and provider_id are required" });
    }

    const sql = 'UPDATE social_auth SET provider = COALESCE(?, provider), provider_id = COALESCE(?, provider_id) WHERE user_id = ?';
    const [result] = await db.promise().query(sql, [provider, provider_id, user_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, message: "Social account updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Delete
exports.deleteSocialAuth = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    const sql = 'DELETE FROM social_auth WHERE user_id = ?';
    const [result] = await db.promise().query(sql, [user_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, message: "Social account deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};
