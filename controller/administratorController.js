const db = require('../config/db');

// Create
exports.createAdministrator = async (req, res) => {
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({ message: 'user_id and role are required' });
    }

    const [exists] = await db.promise().query('SELECT * FROM administrator WHERE user_id = ?', [user_id]);
    if (exists.length > 0) {
      return res.status(409).json({ message: 'Administrator already exists' });
    }

    const sql = 'INSERT INTO administrator (user_id, role) VALUES (?, ?)';
    await db.promise().query(sql, [user_id, role]);

    res.status(201).json({ message: 'Administrator created successfully', user_id, role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all
exports.getAllAdministrators = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM administrator');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read by ID
exports.getAdministratorById = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const [rows] = await db.promise().query('SELECT * FROM administrator WHERE user_id = ?', [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
exports.updateAdministrator = async (req, res) => {
  try {
    const { user_id } = req.params;
    const updates = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const [exists] = await db.promise().query('SELECT * FROM administrator WHERE user_id = ?', [user_id]);
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    // Build update query dynamically based on provided fields
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const sql = `UPDATE administrator SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(user_id);

    await db.promise().query(sql, values);

    res.json({ message: 'Administrator updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
exports.deleteAdministrator = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const [rows] = await db.promise().query('SELECT * FROM administrator WHERE user_id = ?', [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    await db.promise().query('DELETE FROM administrator WHERE user_id = ?', [user_id]);
    res.json({ message: 'Administrator deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
