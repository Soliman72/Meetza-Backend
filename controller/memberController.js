const db = require('../config/db');

// Create
exports.createMember = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const [exists] = await db.promise().query('SELECT * FROM member WHERE user_id = ?', [user_id]);
    if (exists.length > 0) {
      return res.status(409).json({ message: 'Member already exists' });
    }

    const sql = 'INSERT INTO member (user_id) VALUES (?)';
    await db.promise().query(sql, [user_id]);

    res.status(201).json({ message: 'Member created successfully', user_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all
exports.getAllMembers = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM member');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read by ID
exports.getMemberById = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const [rows] = await db.promise().query('SELECT * FROM member WHERE user_id = ?', [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
exports.updateMember = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { new_user_id } = req.body;

    if (!user_id || !new_user_id) {
      return res.status(400).json({ message: 'user_id and new_user_id are required' });
    }

    const [exists] = await db.promise().query('SELECT * FROM member WHERE user_id = ?', [user_id]);
    if (exists.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const sql = 'UPDATE member SET user_id = ? WHERE user_id = ?';
    await db.promise().query(sql, [new_user_id, user_id]);

    res.json({ message: 'Member updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
exports.deleteMember = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const [rows] = await db.promise().query('SELECT * FROM member WHERE user_id = ?', [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await db.promise().query('DELETE FROM member WHERE user_id = ?', [user_id]);
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
