const db = require('../config/db');

// Create
exports.createSocialAuth = async (data) => {
  try {
    const { user_id, provider, provider_id } = data;

    if (!user_id || !provider || !provider_id) {
      throw new Error("user_id, provider, and provider_id are required");
    }

    const sql = 'INSERT INTO social_auth (user_id, provider, provider_id) VALUES (?, ?, ?)';
    await db.promise().query(sql, [user_id, provider, provider_id]);

    return { user_id, provider, provider_id };
  } catch (err) {
    throw err;
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
    const { user_id } = req.params;
    const { provider, provider_id } = req.body;
    if (!user_id || !provider || !provider_id) {
      return res.status(400).json({ message: 'user_id, provider, and provider_id are required' });
    }

    const sql = 'UPDATE social_auth SET provider = COALESCE(?, provider), provider_id = COALESCE(?, provider_id) WHERE user_id = ?';
    const [result] = await db.promise().query(sql, [provider, provider_id, user_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json({ message: 'Social account updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
exports.deleteSocialAuth = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: 'id is required' });
    }

    const sql = 'DELETE FROM social_auth WHERE user_id = ?';
    const [result] = await db.promise().query(sql, [user_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Social account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
