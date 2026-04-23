const { v4: uuidv4 } = require("uuid");
const sendEmail = require("../utils/sendEmail");
const contactValidator = require("../validators/contactValidator");

function adminNotificationTemplate(name, email, message) {
  const year = new Date().getFullYear();
  return `
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
                  <tr>
                    <td style="padding:26px 30px;text-align:center;background:#f8fafc;border-bottom:1px solid #e5eaf3;">
                      <h2 style="margin:0;color:#0f172a;font-size:20px;font-weight:600;">New Contact Message</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:44px 42px 40px;">
                      <div style="margin-bottom:24px;">
                        <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;">From</p>
                        <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">${name || "Anonymous"}</p>
                        <p style="margin:4px 0 0;color:#64748b;font-size:14px;">${email || "Anonymous"}</p>
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
                  <tr>
                    <td style="background:#f8fafc;padding:26px 24px;text-align:center;border-top:1px solid #e5eaf3;">
                      <p style="margin:0 0 6px;color:#475569;font-size:12px;">© ${year} Meetza. All rights reserved.</p>
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
}

function userConfirmationTemplate(message) {
  const year = new Date().getFullYear();
  return `
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
                  <tr>
                    <td style="padding:26px 30px;text-align:center;background:#f8fafc;border-bottom:1px solid #e5eaf3;">
                      <h2 style="margin:0;color:#0f172a;font-size:20px;font-weight:600;">Thank You for Contacting Us!</h2>
                    </td>
                  </tr>
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
                  <tr>
                    <td style="background:#f8fafc;padding:26px 24px;text-align:center;border-top:1px solid #e5eaf3;">
                      <p style="margin:0 0 6px;color:#475569;font-size:12px;">© ${year} Meetza. All rights reserved.</p>
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
}

exports.createContact = async (body) => {
  contactValidator.validateCreateContact(body);
  const { name, email, message } = body;
  const id = uuidv4();
  const adminEmail = process.env.EMAIL_USER;

  if (adminEmail) {
    try {
      await sendEmail({
        to: adminEmail,
        subject: `New Contact Message: ${message}`,
        html: adminNotificationTemplate(name, email, message),
      });
    } catch (err) {
      console.error("Error sending contact email:", err);
    }
  }

  if (email) {
    try {
      await sendEmail({
        to: email,
        subject: "We Received Your Message - Meetza",
        html: userConfirmationTemplate(message),
      });
    } catch (err) {
      console.error("Error sending confirmation email:", err);
    }
  }

  return { id, name, email, message };
};
