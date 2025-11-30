const db = require("../config/db");

// Get Member Notifications
exports.getMemberNotifications = async (req, res) => {
    try {
        const memberId = req.params.id;

        const [notifications] = await db.promise().query(
            "SELECT * FROM notifications WHERE member_id = ? ORDER BY created_at DESC",
            [memberId]
        );

        return res.status(200).json({ success: true, notifications });

    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
};

// Get Unread Notifications Count
exports.getUnreadCount = async (req, res) => {
    try {
        const memberId = req.params.id;
        const [rows] = await db.promise().query(
            "SELECT COUNT(*) AS unreadCount FROM notifications WHERE member_id = ? AND is_read = 0",
            [memberId]
        );
        const unreadCount = rows[0].unreadCount;
        return res.status(200).json({ success: true, unreadCount });

    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
};

// Mark Notification as Read
exports.markAsRead = async (req, res) => {
    try {
        const notifId = req.params.id;

       
        const [result] = await db.promise().query(
            "UPDATE notifications SET is_read = 1 WHERE id = ?",
            [notifId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }

        return res.status(200).json({
            success: true,
            notification,
            message: "Notification marked as read"
        });

    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
};

// Mark All Notifications as Read for a Member
exports.markAllAsRead = async (req, res) => {
    try {
        const memberId = req.params.id;
        const [result] = await db.promise().query(
            "UPDATE notifications SET is_read = 1 WHERE member_id = ? AND is_read = 0",
            [memberId]
        );
        return res.status(200).json({
            success: true,
            message: `${result.affectedRows} notifications marked as read`
        });
    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
};

// Delete Notification
exports.deleteNotification = async (req, res) => {
    try {
        const notifId = req.params.id;
        const memberId = req.user.id;
        // check if member who is deleting the notification is the owner
        // const memberId = req.body.memberId;
        // const [rows] = await db.promise().query(
        //     "SELECT * FROM notifications WHERE id = ? AND member_id = ?",
        //     [notifId, memberId]
        // );
        // if (rows.length === 0) {
        //     return res.status(403).json({ error: "Unauthorized to delete this notification" });
        // }

        const [result] = await db.promise().query(
            "DELETE FROM notifications WHERE id = ? AND member_id = ?",
            [notifId, memberId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }   
};