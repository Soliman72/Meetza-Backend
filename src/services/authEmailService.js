const nodemailer = require("nodemailer");

function sendVerificationEmail(email, verificationCode, msg) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f2f4f7;">
      <table role="presentation" style="width:100%;border-collapse:collapse;background:#f2f4f7;">
        <tr>
          <td style="padding:48px 16px;">
            <table role="presentation" style="width:100%;max-width:620px;margin:0 auto;background:#ffffff;border-radius:20px;box-shadow:0 20px 60px rgba(15,23,42,0.12);overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="padding:26px 30px;text-align:center;background:#f8fafc;border-bottom:1px solid #e5eaf3;">
                  <table role="presentation" style="margin:0 auto;border-collapse:collapse;">
                    <tr>
                      <td style="padding-right:10px;">
                        <img src="https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_kd3j3a.png"
                             alt="Meetza Icon"
                             style="max-width:48px;height:auto;display:block;">
                      </td>
                      <td style="padding-left:10px;">
                        <img src="https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_name_dqrdvl.png"
                             alt="Meetza"
                             style="max-width:150px;height:auto;display:block;">
                      </td>
                    </tr>
                  </table>
                  <p style="margin:10px 0 0;color:#64748b;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                    Secure Access Channel
                  </p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding:44px 42px 40px;">
                  <h2 style="margin:0 0 18px;text-align:center;color:#0f172a;font-size:24px;font-weight:600;">
                    ${msg.includes('register') ? 'Welcome to Meetza!' : 'Password Reset Request'}
                  </h2>
                  <p style="margin:0 auto 30px;color:#4a5568;font-size:15px;line-height:1.7;text-align:center;max-width:520px;">
                    ${msg.replace(/<[^>]*>/g, '').replace('Thank you for registering!', '').trim() ||
    (msg.includes('register')
      ? 'Thanks for joining Meetza. Use the verification code below to confirm your email and activate your workspace.'
      : 'Use the verification code below to reset your password safely.')}
                  </p>
                  <!-- Code box -->
                  <div style="margin:28px auto 32px;background:#0f172a;border-radius:18px;padding:32px 24px;text-align:center;">
                    <p style="margin:0 0 14px;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:4px;text-transform:uppercase;">Your code</p>
                    <div style="display:inline-block;padding:22px 28px;border-radius:12px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);">
                      <span style="color:#ffffff;font-size:38px;font-weight:700;letter-spacing:10px;font-family:'Courier New',monospace;">
                        ${verificationCode}
                      </span>
                    </div>
                    <p style="margin:18px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Code expires in 24 hours</p>
                  </div>
                  <!-- Instructions -->
                  <div style="background:#f8fafc;border-left:4px solid #0f172a;padding:20px 24px;border-radius:12px;margin-bottom:26px;">
                    <p style="margin:0;color:#1f2a37;font-size:14px;line-height:1.7;">
                      <strong style="text-transform:uppercase;letter-spacing:1px;font-size:12px;color:#0f172a;">Instructions</strong><br>
                      ${msg.includes('register')
      ? 'Copy the code, head to the verification screen, and finish activating your Meetza account.'
      : 'Enter the code on the password reset page to securely set a new password.'}
                    </p>
                  </div>
                  <p style="margin:0;text-align:center;color:#94a3b8;font-size:12px;line-height:1.7;border-top:1px solid #e2e8f0;padding-top:20px;">
                    If you did not request this ${msg.includes('register') ? 'verification' : 'password reset'}, you can safely ignore this message or contact support.
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

  const mailOptions = {
    from: `"Meetza" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: msg.includes('register') ? "Verify Your Email Address - Meetza" : "Reset Your Password - Meetza",
    html: emailTemplate,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendVerificationEmail,
};
