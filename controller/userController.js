const db = require('../config/db');
const administratorController = require('./administratorController');
const memberController = require('./memberController');

// Create
exports.createUser = async (req, res) => {
    try {
        const {id, name, email, password, role, verification_code, email_verification } = req.body;

        if (!id || !name || !email || !password || !role || !verification_code || !email_verification) {
            return res.status(400).json({ message: 'One or more fields are required' });
        }

        const [exists] = await db.promise().query('SELECT * FROM user WHERE email = ?', [email]);
        if (exists.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const sql = 'INSERT INTO user (id, name, email, password, role, verification_code, email_verification) VALUES (?, ?, ?, ?, ?, ?, ?)';
        await db.promise().query(sql, [id, name, email, password, role, verification_code, email_verification]);

        if(role === 'Administrator'){
            const reqadmin = { body: { user_id: id, role: role } };
            await administratorController.createAdministrator(reqadmin, res);
        } else if (role === 'Member') {
            const reqmember = { body: { user_id: id } };
            await memberController.createMember(reqmember, res);
        }

        res.status(201).json({ message: 'User created successfully', name, email });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
        const updates = req.body;

        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }

        // Check if user exists
        const [exists] = await db.promise().query('SELECT * FROM user WHERE id = ?', [id]);
        if (exists.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build dynamic update query
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const sql = `UPDATE user SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        await db.promise().query(sql, values);
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
