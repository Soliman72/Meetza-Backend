const sendEmail = require('../utils/sendEmail');
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

// Init Socket.IO for Notifications
let io = null;

const initNotificationSocket = (socketIo) => {
    io = socketIo;
};


// Create Notification Function (NOT an endpoint)
const createNotification = async ({ senderId, memberId, title, message }) => {
    try {
        if (!memberId || !title || !message || !senderId) {
            return { success: false, error: "Missing fields" };
        }

        const id = uuidv4();

        // 1) Save to DB
        await db.promise().query(
            "INSERT INTO notifications (id, member_id, sender_id, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, memberId, senderId, title, message, 0, new Date()]
        );

        const notification = {
            id,
            memberId,
            senderId,
            title,
            message,
            is_read: 0,
            created_at: new Date(),
        };
        console.log("Notification created:", notification);
        // 2) Send socket notification
        if (io) {
            console.log("Emitting notification via socket to member:", memberId);
            io.to("member_" + memberId).emit("new_notification", notification);
        }
        console.log("Notification sent via socket to member:", memberId);
        // 3) Send email
        const [[member]] = await db.promise().query(
            "SELECT email, name FROM user WHERE id = ?",
            [memberId]
        );

        const [[sender]] = await db.promise().query(
            "SELECT name FROM user WHERE id = ?",
            [senderId]
        );

        const senderName = sender ? sender.name : "Meetza Team";

        // Email template with beautiful design
        const emailTemplate = `
        <div style="font-family:Arial; padding:20px;">
          <h2 style="color:#0f172a;">New Update from ${senderName}</h2>
            <p>${message}</p>
            <p style="margin-top:20px; font-size:12px; color:#6b7280;">
            This is an automated notification from Meetza.
            </p>
        </div>`;



        if (member?.email) {
            await sendEmail({
                to: member.email,
                subject: `New Notification: ${title}`,
                html: emailTemplate,
            }).then(() =>{
                console.log("Notification Email sent to:", member.email);
            })
            .catch((err) => {
                console.log("Email Error:", err);
            });
        }
        console.log("Notification process completed for member:", memberId);
        return { success: true, notification };

    } catch (err) {
        console.log("Notification Error:", err);
        return { success: false, error: "Failed to create notification" };
    }
};

module.exports = {
    initNotificationSocket,
    createNotification,
};