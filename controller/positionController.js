const db = require('../config/db');
const { v4: uuidv4 } = require("uuid");

// Create
exports.createPosition = async (req, res) => {
    try {
        const { title } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({ message: 'title are required' });
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

        const sql = "INSERT INTO `position` (id, title, administrator_id) VALUES (?, ?, ?)";
        const [result] = await db.promise().query(sql, [id, title, req.body.administrator_id]);
        res.status(201).json({ id: id, title, administrator_id: req.body.administrator_id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Read all
exports.getAllPositions = async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM position');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Read by id
exports.getPositionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        const [rows] = await db.promise().query('SELECT * FROM position WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update
exports.updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!id || !title) {
            return res.status(400).json({ message: 'id in params and title in body are required' });
        }
        const sql = 'UPDATE position SET title = ? WHERE id = ?';
        const [result] = await db.promise().query(sql, [title, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.json({ id, title });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete
exports.deletePosition = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        const sql = 'DELETE FROM position WHERE id = ?';
        const [result] = await db.promise().query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};