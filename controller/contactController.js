const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const sendEmail = require("../utils/sendEmail");

// Create a contact message
exports.createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const id = uuidv4();

    // Send email notification to admin (optional - you can set this in .env)
    const adminEmail = process.env.EMAIL_USER;

    if (adminEmail) {
      const emailTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Message</title>
        </head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f2f4f7;">
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f2f4f7;">
            <tr>
              <td style="padding:48px 16px;">
                <table role="presentation" style="width:100%;max-width:620px;margin:0 auto;background:#ffffff;border-radius:20px;box-shadow:0 20px 60px rgba(15,23,42,0.12);overflow:hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding:26px 30px;text-align:center;background:#f8fafc;border-bottom:1px solid #e5eaf3;">
                      <h2 style="margin:0;color:#0f172a;font-size:20px;font-weight:600;">New Contact Message</h2>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding:44px 42px 40px;">
                      <div style="margin-bottom:24px;">
                        <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;">From</p>
                        <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">${name}</p>
                        <p style="margin:4px 0 0;color:#64748b;font-size:14px;">${email}</p>
                      </div>
                      
                      <div style="margin-bottom:24px;">
                      <div style="background:#f8fafc;border-left:4px solid #00897b;padding:20px 24px;border-radius:12px;margin-bottom:26px;">
                        <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Message</p>
                        <p style="margin:0;color:#1f2a37;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
                      </div>
                      
                      <p style="margin:0;text-align:center;color:#94a3b8;font-size:12px;line-height:1.7;border-top:1px solid #e2e8f0;padding-top:20px;">
                        This message was sent through the Meetza contact form.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;padding:26px 24px;text-align:center;border-top:1px solid #e5eaf3;">
                      <p style="margin:0 0 6px;color:#475569;font-size:12px;">© ${new Date().getFullYear()} Meetza. All rights reserved.</p>
                      <p style="margin:0;color:#94a3b8;font-size:11px;">This is an automated message.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Send email asynchronously (don't wait for it)
      sendEmail({
        to: adminEmail,
        subject: `New Contact Message: ${message}`,
        html: emailTemplate,
      }).catch((err) => {
        console.error("Error sending contact email:", err);
        // Don't fail the request if email fails
      });
    }

    // Send confirmation email to user
    const confirmationTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Received</title>
      </head>
      <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f2f4f7;">
        <table role="presentation" style="width:100%;border-collapse:collapse;background:#f2f4f7;">
          <tr>
            <td style="padding:48px 16px;">
              <table role="presentation" style="width:100%;max-width:620px;margin:0 auto;background:#ffffff;border-radius:20px;box-shadow:0 20px 60px rgba(15,23,42,0.12);overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding:26px 30px;text-align:center;background:#f8fafc;border-bottom:1px solid #e5eaf3;">
                    <h2 style="margin:0;color:#0f172a;font-size:20px;font-weight:600;">Thank You for Contacting Us!</h2>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding:44px 42px 40px;">
                    <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;text-align:center;">
                      We have received your message and will get back to you as soon as possible.
                    </p>
                    <div style="background:#f8fafc;border-left:4px solid #00897b;padding:20px 24px;border-radius:12px;margin-bottom:26px;">
                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your Message</p>
                      <p style="margin:0;color:#1f2a37;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
                    </div>
                    <p style="margin:0;text-align:center;color:#94a3b8;font-size:12px;line-height:1.7;">
                      We typically respond within 24-48 hours.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;padding:26px 24px;text-align:center;border-top:1px solid #e5eaf3;">
                    <p style="margin:0 0 6px;color:#475569;font-size:12px;">© ${new Date().getFullYear()} Meetza. All rights reserved.</p>
                    <p style="margin:0;color:#94a3b8;font-size:11px;">This is an automated message, please do not reply.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send confirmation email to user (asynchronously)
    sendEmail({
      to: email,
      subject: "We Received Your Message - Meetza",
      html: confirmationTemplate,
    }).catch((err) => {
      console.error("Error sending confirmation email:", err);
      // Don't fail the request if email fails
    });

    res.status(201).json({
      success: true,
      message: "Contact message sent successfully",
      data: {
        id,
        name,
        email,
        message,
      },
    });
  } catch (error) {
    console.error("Contact creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send contact message",
      error: error.message,
    });
  }
};
