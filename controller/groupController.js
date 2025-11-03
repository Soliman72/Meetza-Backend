const db = require('../config/db');
const { v4: uuidv4 } = require("uuid");

// Create
exports.createGroup = async (req, res) => {
    try {
        const { group_name, position_id } = req.body;
        if (!group_name || !position_id) {
            return res.status(400).json({ message: 'group_name and position_id are required' });
        }
        // Chieck if position_id exists
        const [positionRows] = await db.promise().query('SELECT * FROM position WHERE id = ?', [position_id]);
        if (positionRows.length === 0) {
            return res.status(400).json({ message: 'Invalid position_id: not found' });
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
        const id = uuidv4();
        const sql = "INSERT INTO `group` (id, group_name, position_id, administrator_id) VALUES (?, ?, ?, ?)";
        const [result] = await db.promise().query(sql, [id, group_name, position_id, req.body.administrator_id]);
        res.status(201).json({ id: result.insertId, group_name, position_id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Read all
exports.getAllGroups = async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM `group`');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Read by id
exports.getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        const [rows] = await db.promise().query('SELECT * FROM `group` WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update
exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { group_name, position_id } = req.body;
        if (!id || !group_name || !position_id) {
            return res.status(400).json({ message: 'id, group_name and position_id are required' });
        }
        const sql = 'UPDATE `group` SET group_name = ?, position_id = ? WHERE id = ?';
        const [result] = await db.promise().query(sql, [group_name, position_id, id]);
        res.json({ message: 'Group updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete
exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        const sql = 'DELETE FROM `group` WHERE id = ?';
        const [result] = await db.promise().query(sql, [id]);
        res.json({ message: 'Group deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};