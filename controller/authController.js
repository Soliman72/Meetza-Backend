const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const passport = require("passport");
const userController = require("./userController");
const social_authController = require("./social_authController");
const axios = require("axios");

// Register new user with email verification
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !password || !role || !email) {
      return res.status(400).json({
        success: false,
        message: "One or more fields are required",
      });
    }

    // Check if email already exists
    const [rows] = await db
      .promise()
      .query("SELECT email FROM user WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Generate a 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000);

    // Insert new user (with 'verified' flag set to false)
    const userData = {
      body: {
        name,
        email,
        password,
        role,
        verification_code: verificationCode,
        email_verification: `false`,
      },
    };
    await userController.createUser(userData);

    // Send verification email with 4-digit code
    sendVerificationEmail(
      email,
      verificationCode,
      "<p>Thank you for registering! Please use the following code to verify your email:</p>"
    )
      .then(() => {
        return res.status(201).json({
          success: true,
          message:
            "User registered successfully. Please check your email to verify your account.",
          data: { name, email, role },
        });
      })
      .catch(async (emailError) => {
        // If email fails to send, delete the user from the database
        await db.promise().query("DELETE FROM user WHERE email = ?", [email]);
        return res.status(500).json({
          success: false,
          message:
            "Failed to send verification email. User registration has been cancelled.",
          error: emailError.message,
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, remember_me, role, from, captchaToken } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email , password , captchaToken and role are required",
      });
    }

    // const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    // const response = await axios.post(verifyUrl, null, {
    //   params: {
    //     secret: process.env.RECAPTCHA_SECRET_KEY,
    //     response: captchaToken,
    //   },
    // });

    // const { success, score, action } = response.data;

    // if (!success) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "CAPTCHA verification failed" });
    // }

    // Check if user exists
    const [rows] = await db
      .promise()
      .query("SELECT * FROM user WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Invalid role for this user",
      });
    }

    // check email verification
    if (!user.email_verification) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // check from dashboard or other platform
    if (
      from &&
      from === "dashboard" &&
      user.role !== "Administrator" &&
      user.role !== "Super_Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrators only.",
      });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: remember_me === "true" ? "4d" : "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

// Email Verification Route
exports.verifyEmail = async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({
        success: false,
        message: "Verification code & Email is required",
      });
    }

    // Verify code in the database
    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM user WHERE verification_code = ? AND email_verification = false AND email = ?",
        [code, email]
      );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    const user = rows[0];

    // Mark as verified
    await db
      .promise()
      .query(
        "UPDATE user SET email_verification = true, verification_code = NULL WHERE email = ?",
        [user.email]
      );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("verifyEmail error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying email",
      error: error.message,
    });
  }
};

// Forgot password - Step 1: Send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if the email exists in the database
    const [rows] = await db
      .promise()
      .query("SELECT * FROM user WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    // const user = rows[0];
    const resetCode = Math.floor(1000 + Math.random() * 9000); // Generate a unique token for password reset

    // Store the reset token in the database
    await db
      .promise()
      .query("UPDATE user SET verification_code = ? WHERE email = ?", [
        resetCode,
        email,
      ]);
    // Send verification email with 4-digit code
    await sendVerificationEmail(
      email,
      resetCode,
      "<p>Thank you for registering! Please use the following code to reset your password:</p>"
    );
    return res.status(201).json({
      success: true,
      message: "Please check your email to reset password",
    });
  } catch (emailError) {
    return res.status(500).json({
      success: false,
      message: "Failed to send verification email",
      error: emailError.message,
    });
  }
};

// Code Verification Route for reset password
exports.verifyCode = async (req, res) => {
  try {
    const { code, email } = req.body;
    if (!code || !email) {
      return res.status(400).json({
        success: false,
        message: "Verification code & Email is required",
      });
    }

    // Verify code in the database
    const [rows] = await db
      .promise()
      .query("SELECT * FROM user WHERE verification_code = ? AND email = ?", [
        code,
        email,
      ]);
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    const user = rows[0];

    // Mark user as verified
    await db
      .promise()
      .query("UPDATE user SET verification_code = NULL WHERE email = ?", [
        user.email,
      ]);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now reset password.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying code",
      error: error.message,
    });
  }
};

// Code Verification Route for reset password
exports.resetPassword = async (req, res) => {
  try {
    const { is_verifyed, email, new_password } = req.body;
    if (!is_verifyed || !new_password || !email) {
      return res.status(400).json({
        success: false,
        message: "New password & Email is required",
      });
    }
    if (is_verifyed === "true") {
      // Verify code in the database
      const [rows] = await db
        .promise()
        .query("SELECT * FROM user WHERE email = ?", [email]);
      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid email!",
        });
      }
      const user = rows[0];
      const hashedPassword = await bcrypt.hash(new_password, 10);
      // Mark user as verified
      await db
        .promise()
        .query("UPDATE user SET password = ? WHERE email = ?", [
          hashedPassword,
          user.email,
        ]);

      res.status(200).json({
        success: true,
        message: "password change successfully. You can now login.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "is_verifyed is false",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};

// Social Authentication
exports.socialAuth = (req, res, next) => {
  const role = req.query.role; // Administrator or Member
  const state = JSON.stringify({ role });

  const scope = ["email", "profile"];
  
  passport.authenticate("google", {
    scope,
    session: false,
    state,
    callbackURL: process.env.CALLBACK_URL,
  })(req, res, next);
};

// Social Authentication Callback
exports.socialAuthCallback = (req, res, next) => {
  console.log("CALLBACK_URL used:", process.env.CALLBACK_URL);
  passport.authenticate("google", { session: false }, async (err, profile) => {
    if (err) {
      console.error("Passport error:", err);
      return res.status(500).json({
        success: false,
        message: `google callback error`,
        error: err.message || err,
      });
    }
    if (!profile) {
      return res
        .status(400)
        .json({ success: false, message: `${"google"} login failed` });
    }
    // console.log("Google profile received:", profile);


    try {
      // parse state
      const stateObj = req.query.state
        ? JSON.parse(req.query.state)
        : { role: "" };
      const role = stateObj.role;

      // extract email and provider id
      let user;
      const actualProfile = profile.profile || profile;
      const email = actualProfile._json?.email || actualProfile.emails?.[0]?.value;

      // console.log("email",email);
      const providerId = actualProfile.id;
      const name =
        actualProfile.displayName ||
        `${actualProfile.name?.givenName || ""} ${actualProfile.name?.familyName || ""}`.trim() ||
        "NoName";


      // 1 Check user_providers for provider + provider_id
      const [rows] = await db
        .promise()
        .query(
          "SELECT * FROM social_auth WHERE provider = ? AND provider_id = ? LIMIT 1",
          ["google", providerId]
        );
      if (rows.length > 0) {
        // linked provider exists -> get user
        const [users] = await db
          .promise()
          .query("SELECT * FROM user WHERE email = ? LIMIT 1", [email]);
        user = users[0];
        return proceedWithUser(user, "google", res);
      } else if (email) {
        // 2 If user with email exists -> auto-link
        const [rowsEmail] = await db
          .promise()
          .query("SELECT * FROM user WHERE email = ? LIMIT 1", [email]);
        if (rowsEmail.length > 0) {
          user = rowsEmail[0];
          // insert into social_auth (ignore duplicate errors)
          await social_authController.createSocialAuth({
            user_id: user.id,
            provider: "google",
            provider_id: providerId,
          });
          // ensure email verification true
          await db.promise().query(
            "UPDATE user SET ? WHERE email_verification = true"
          );
          return proceedWithUser(user, "google", res);
        } else {
          // 3 Create new user and link provider
          await userController.createUser({
            body: {
              name,
              email,
              password: uuidv4(), // random password
              role,
              verification_code: "0000",
              email_verification: true,
            },
          });
          const id = (
            await db
              .promise()
              .query("SELECT id FROM user WHERE email = ?", [email])
          )[0][0].id;
          await social_authController.createSocialAuth({
            user_id: id,
            provider: "google",
            provider_id: providerId,
          });
          // Fetch new user details
          const [newRows] = await db
            .promise()
            .query("SELECT * FROM user WHERE email = ?", [email]);
          user = newRows[0];
          return proceedWithUser(user, "google", res);
        }
      } else {
        console.error("Social callback error: No email provided");
        return res.status(500).json({
          success: false,
          message: "There is no email!",
        });
      }
    } catch (error) {
      console.error("Social callback error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  })(req, res, next);
};

// Helper function to send the verification email
const sendVerificationEmail = (email, verificationCode, msg) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email template with beautiful design
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
};

// Helper function to proceed with user creation and token generation
function proceedWithUser(user, platform, res) {
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    email_verification: user.email_verification,
    created_at: user.created_at,
    updated_at: user.updated_at
  };

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "24h" });

  return res.status(200).json({
    success: true,
    message: `${platform} login successful`,
    token,
    user: safeUser,
  });
}

