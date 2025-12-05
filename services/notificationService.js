const sendEmail = require("../utils/sendEmail");
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

    // get name of sender
    const [sender] = await db
      .promise()
      .query("SELECT * FROM user WHERE id = ?", [senderId]);

    const senderName = rows.length > 0 ? sender[0].name : "Meetza Team";
    // 1) Save to DB
    await db
      .promise()
      .query(
        "INSERT INTO notifications (id, member_id, sender_id, title, message, is_read) VALUES (?, ?, ?, ?, ?, ?)",
        [id, memberId, senderId, title, message, 0]
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

    // 2) Send socket notification
    if (io) {
      try {
        console.log("Emitting notification via socket to member:", memberId);
        io.to("member_" + memberId).emit("new_notification", notification);
        console.log("Notification sent via socket to member:", memberId);
      } catch (socketError) {
        console.error("Error sending socket notification:", socketError);
        // Continue even if socket fails
      }
    } else {
      console.warn(
        "Socket.IO not initialized, notification not sent via socket"
      );
    }
    // 3) Send email
    const [[member]] = await db
      .promise()
      .query("SELECT email FROM user WHERE id = ?", [memberId]);

    // Email template with beautiful design
    const emailTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Meetza Notification</title>
        </head>

        <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Verdana,sans-serif;background:#f2f4f7;">

          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f2f4f7;">
            <tr>
              <td style="padding:48px 16px;">

                <table role="presentation" style="width:100%;max-width:620px;margin:0 auto;background:#ffffff;
                    border-radius:20px;box-shadow:0 20px 60px rgba(15,23,42,0.12);overflow:hidden;">

                  <!-- Header -->
                  <tr>
                    <td style="padding:26px 30px;text-align:center;background:#f8fafc;border-bottom:1px solid #e5eaf3;">
                      <table role="presentation" style="margin:0 auto;border-collapse:collapse;">
                        <tr>
                          <td style="padding-right:10px;">
                            <img src="https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_kd3j3a.png"
                              alt="Meetza Icon" style="max-width:48px;height:auto;display:block;" />
                          </td>
                          <td style="padding-left:10px;">
                            <img src="https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_name_dqrdvl.png"
                              alt="Meetza" style="max-width:150px;height:auto;display:block;" />
                          </td>
                        </tr>
                      </table>
                      <p style="margin:10px 0 0;color:#64748b;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                        New Group Content
                      </p>
                    </td>
                  </tr>

                  <!-- Message Content -->
                  <tr>
                    <td style="padding:40px 42px 38px;">

                      <h2 style="margin:0 0 14px;text-align:center;color:#0f172a;font-size:22px;font-weight:600;">
                        New Update from ${senderName}
                      </h2>

                      <p style="margin:0 auto;color:#4a5568;font-size:15px;line-height:1.7;text-align:center;max-width:520px;">
                        ${message}
                      </p>

                      <!-- Highlight Box -->
                      <div style="margin:32px auto 24px;background:#f8fafc;border-left:4px solid #0f172a;
                                  padding:20px 22px;border-radius:12px;max-width:520px;">
                        <p style="margin:0;color:#1f2a37;font-size:14px;line-height:1.7;">
                          This notification indicates that new data or content has been added to your group on Meetza.
                        </p>
                      </div>

                      <p style="margin:0;text-align:center;color:#94a3b8;font-size:12px;line-height:1.7;
                                border-top:1px solid #e2e8f0;padding-top:20px;">
                        If you believe this notification was not intended for you, feel free to ignore it.
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;padding:26px 24px;text-align:center;border-top:1px solid #e5eaf3;">
                      <p style="margin:0 0 6px;color:#475569;font-size:12px;">
                        © ${new Date().getFullYear()} Meetza. All rights reserved.
                      </p>
                      <p style="margin:0;color:#94a3b8;font-size:11px;">
                        This is an automated message, please do not reply.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>`;

    // 3) Send email (non-blocking)
    if (member?.email) {
      sendEmail({
        to: member.email,
        subject: `New Notification: ${title}`,
        html: emailTemplate,
      })
        .then(() => {
          console.log("Notification Email sent to:", member.email);
        })
        .catch((err) => {
          console.error("Email Error:", err);
          // Email failure should not block notification creation
        });
    } else {
      console.warn(`Member ${memberId} has no email address`);
    }
    console.log("Notification process completed for member:", memberId);
    return { success: true, notification };
  } catch (err) {
    console.error("Notification Error:", err);
    return {
      success: false,
      error: err.message || "Failed to create notification",
    };
  }
};

module.exports = {
  initNotificationSocket,
  createNotification,
};
