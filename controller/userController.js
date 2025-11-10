const db = require('../config/db');
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const administratorController = require('./administratorController');
const memberController = require('./memberController');

// Create
exports.createUser = async (data) => {
  try {
    const { name, email, password, role, verification_code, email_verification } = data.body;

    // Validate required fields
    if (!name || !email || !password || !role || !verification_code || !email_verification) {
      throw new Error('One or more fields are required');
    }

    // Check if user already exists
    const [exists] = await db.promise().query('SELECT * FROM user WHERE email = ?', [email]);
    if (exists.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Generate a unique ID for the new user
    const id = uuidv4();

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user record
    const sql =
      'INSERT INTO user (id, name, email, password, role, verification_code, email_verification) VALUES (?, ?, ?, ?, ?, ?, ?)';
    await db.promise().query(sql, [
      id,
      name,
      email,
      hashedPassword,
      role,
      verification_code,
      email_verification,
    ]);

    // Create corresponding record based on role
    if (role === 'Administrator') {
      const reqadmin = { body: { user_id: id, role } };
      await administratorController.createAdministrator(reqadmin); // No res passed here
    } else if (role === 'Member') {
      const reqmember = { body: { user_id: id } };
      await memberController.createMember(reqmember); // No res passed here
    }

    // Return data to the caller instead of sending response here
    return { id, name, email, role };
  } catch (err) {
    throw err;
  }
};

// Read all
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM user');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Read by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        const [rows] = await db.promise().query('SELECT * FROM user WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {name, email, password, role, verification_code, email_verification } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        if (!name && !email && !password && !role && !verification_code && !email_verification) {
            return res.status(400).json({ message: 'At least one field is required to update' });
        }

        await db.promise().query(
            'UPDATE user SET name = COALESCE(?, name), email = COALESCE(?, email), password = COALESCE(?, password), role = COALESCE(?, role), verification_code = COALESCE(?, verification_code), email_verification = COALESCE(?, email_verification) WHERE id = ?',
            [name, email, password, role, verification_code, email_verification, id]
        );
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        const sql = 'DELETE FROM user WHERE id = ?';
        const [result] = await db.promise().query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
