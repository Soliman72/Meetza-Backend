const db = require('../config/db');

// Create
exports.createMember = async (req) => {
  const { user_id } = req.body;

  if (!user_id) {
    throw new Error('user_id is required');
  }

  const [exists] = await db.promise().query(
    'SELECT * FROM member WHERE user_id = ?',
    [user_id]
  );

  if (exists.length > 0) {
    throw new Error('Member already exists');
  }

  const sql = 'INSERT INTO member (user_id) VALUES (?)';
  const [result] = await db.promise().query(sql, [user_id]);

  const [newMember] = await db.promise().query(
    'SELECT * FROM member WHERE user_id = ?',
    [user_id]
  );

  return newMember[0];
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
    const { user_id : new_user_id } = req.body;

    if (!user_id || !new_user_id) {
      return res.status(400).json({ message: 'user_id and new_user_id are required' });
    }
    const sql = 'UPDATE member SET user_id = ? WHERE user_id = ?';
    const [result] = await db.promise().query(sql, [new_user_id, user_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }
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
