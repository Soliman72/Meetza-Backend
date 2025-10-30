const db = require('../config/db');

// Create
exports.createSocialAuth = async (req, res) => {
  try {
    const { user_id, provider, provider_id } = req.body;

    if (!user_id || !provider || !provider_id) {
      return res.status(400).json({ message: 'user_id, provider, and provider_id are required' });
    }

    const sql = 'INSERT INTO social_auth (user_id, provider, provider_id) VALUES (?, ?, ?)';
    const [result] = await db.promise().query(sql, [user_id, provider, provider_id]);
    res.status(201).json({ id: result.insertId, user_id, provider, provider_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all
exports.getAllSocialAuths = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM social_auth');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read by id
exports.getSocialAuthById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'id is required' });
    }

    const [rows] = await db.promise().query('SELECT * FROM social_auth WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
exports.updateSocialAuth = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ message: 'id is required in params' });
    }

    // Build dynamic query
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Check if record exists
    const [exists] = await db.promise().query('SELECT * FROM social_auth WHERE id = ?', [id]);
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Update dynamically
    const sql = `UPDATE social_auth SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await db.promise().query(sql, values);

    res.json({ message: 'Social account updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
exports.deleteSocialAuth = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'id is required' });
    }

    const [rows] = await db.promise().query('SELECT * FROM social_auth WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    await db.promise().query('DELETE FROM social_auth WHERE id = ?', [id]);
    res.json({ message: 'Social account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
