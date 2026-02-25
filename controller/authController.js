const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const passport = require("passport");
const userController = require("./userController");
const social_authController = require("./social_authController");
const axios = require("axios");
const { success: resSuccess, error: resError, authDto } = require("../dto");

// Register new user with email verification
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !password || !role || !email) {
      return res.status(400).json(resError("One or more fields are required"));
    }

    // Check if email already exists
    const [rows] = await db
      .promise()
      .query("SELECT email FROM user WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json(resError("Email already exists"));
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
        email_verification: false,
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
        return res.status(201).json(
          resSuccess(authDto.registerResponse({ name, email, role }), "User registered successfully. Please check your email to verify your account.")
        );
      })
      .catch(async (emailError) => {
        await db.promise().query("DELETE FROM user WHERE email = ?", [email]);
        return res.status(500).json(resError("Failed to send verification email. User registration has been cancelled.", { error: emailError.message }));
      });
  } catch (error) {
    res.status(500).json(resError("Error registering user", { error: error.message }));
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, remember_me, from, captchaToken } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json(resError("Email and password are required"));
    }

    // Validate and verify reCAPTCHA token
    if (captchaToken) {
      try {
        const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
        const response = await axios.post(verifyUrl, null, {
          params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: captchaToken,
          },
        });

        const { success, score } = response.data;

        if (!success) {
          return res.status(400).json(resError("CAPTCHA verification failed. Please try again."));
        }
        if (score !== undefined && score < 0.5) {
          return res.status(400).json(resError("CAPTCHA verification failed. Low score detected."));
        }
      } catch (captchaError) {
        console.error("reCAPTCHA verification error:", captchaError);
        return res.status(500).json(resError("Error verifying CAPTCHA. Please try again.", { error: captchaError.message }));
      }
    }
    // Check if user exists
    const [rows] = await db
      .promise()
      .query("SELECT * FROM user WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json(resError("Invalid email or password"));
    }

    const user = rows[0];


    // check email verification
    if (!user.email_verification) {
      return res.status(403).json(resError("Please verify your email before logging in"));
    }
    if (from && from === "dashboard" && user.role !== "Administrator" && user.role !== "Super_Admin") {
      return res.status(403).json(resError("Access denied. Administrators only."));
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json(resError("Invalid email or password"));
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: remember_me === "true" ? "4d" : "24h" }
    );

    res.status(200).json(resSuccess(authDto.loginResponse(token, user), "Login successful"));
  } catch (error) {
    res.status(500).json(resError("Error logging in", { error: error.message }));
  }
};

// Email Verification Route
exports.verifyEmail = async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json(resError("Verification code & Email is required"));
    }

    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM user WHERE verification_code = ? AND email_verification = false AND email = ?",
        [code, email]
      );

    if (rows.length === 0) {
      return res.status(400).json(resError("Invalid or expired verification code"));
    }

    const user = rows[0];
    await db
      .promise()
      .query(
        "UPDATE user SET email_verification = true, verification_code = NULL WHERE email = ?",
        [user.email]
      );

    return res.status(200).json(resSuccess(null, "Email verified successfully. You can now log in."));
  } catch (error) {
    console.error("verifyEmail error:", error);
    return res.status(500).json(resError("Error verifying email", { error: error.message }));
  }
};

// Forgot password - Step 1: Send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(resError("Email is required"));
    }

    const [rows] = await db
      .promise()
      .query("SELECT * FROM user WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json(resError("Email not found"));
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
    return res.status(201).json(resSuccess(null, "Please check your email to reset password"));
  } catch (emailError) {
    return res.status(500).json(resError("Failed to send verification email", { error: emailError.message }));
  }
};

// Code Verification Route for reset password
exports.verifyCode = async (req, res) => {
  try {
    const { code, email } = req.body;
    if (!code || !email) {
      return res.status(400).json(resError("Verification code & Email is required"));
    }

    const [rows] = await db
      .promise()
      .query("SELECT * FROM user WHERE verification_code = ? AND email = ?", [code, email]);
    if (rows.length === 0) {
      return res.status(400).json(resError("Invalid or expired verification code"));
    }

    const user = rows[0];
    await db
      .promise()
      .query("UPDATE user SET verification_code = NULL WHERE email = ?", [user.email]);

    return res.status(200).json(resSuccess(null, "Email verified successfully. You can now reset password."));
  } catch (error) {
    return res.status(500).json(resError("Error verifying code", { error: error.message }));
  }
};

// Code Verification Route for reset password
exports.resetPassword = async (req, res) => {
  try {
    const { is_verifyed, email, new_password } = req.body;
    if (!is_verifyed || !new_password || !email) {
      return res.status(400).json(resError("New password & Email is required"));
    }
    if (is_verifyed === "true") {
      const [rows] = await db.promise().query("SELECT * FROM user WHERE email = ?", [email]);
      if (rows.length === 0) {
        return res.status(400).json(resError("Invalid email!"));
      }
      const user = rows[0];
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await db.promise().query("UPDATE user SET password = ? WHERE email = ?", [hashedPassword, user.email]);
      res.status(200).json(resSuccess(null, "password change successfully. You can now login."));
    } else {
      return res.status(400).json(resError("is_verifyed is false"));
    }
  } catch (error) {
    return res.status(500).json(resError("Error resetting password", { error: error.message }));
  }
};

// Social Authentication
exports.socialAuth = (req, res, next) => {
  const role = req.query.role || "Member";
  const redirect = req.query.redirect || "http://localhost:3000/home";
  const type = req.query.type || "signin"; // signin or signup

  if (!["Member", "Administrator", "Super_Admin"].includes(role)) {
    return res.status(400).json(resError("Invalid role specified"));
  }
  if (!["signin", "signup"].includes(type)) {
    return res.status(400).json(resError("Invalid type specified"));
  }
  try {
    new URL(redirect);
  } catch (err) {
    return res.status(400).json(resError("Invalid redirect URL format"));
  }

  const state = JSON.stringify({ role, redirect, type });

  passport.authenticate("google", {
    scope: ["email", "profile"],
    session: false,
    state,
  })(req, res, next);
};


// Helper function to redirect with error - redirects to login or signup based on type
function redirectWithError(errorCode, errorMessage, res, type = "signin", redirect) {

  const baseUrl = redirect.includes("https://meetza-front-end.vercel.app") ? "https://meetza-front-end.vercel.app" : "https://meetza-front-end-admin.vercel.app";
  const redirectPath = type == "signin" ? "/login" : "/signup";
  const separator = redirect.includes("?") ? "&" : "?";
  return res.redirect(`${baseUrl}${redirectPath}${separator}error=${errorCode}&error_message=${encodeURIComponent(errorMessage)}&redirect_url=${redirect} &type=${type}`);
}

exports.socialAuthCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, profile) => {
    try {
      // Parse state first to get redirectUrl and type for success redirects
      let stateObj = {};
      let redirectUrl = "http://localhost:3000/home"; // Default redirect for success
      let type = "signin"; // Default type
      
      if (req.query.state) {
        try {
          stateObj = JSON.parse(req.query.state);
          redirectUrl = stateObj.redirect || "http://localhost:3000/home";
          type = stateObj.type || "signin";
        } catch (parseError) {
          console.error("State parse error:", parseError);
          return redirectWithError(
            "invalid_state",
            "Invalid state parameter",
            res,
            "signin",
            redirectUrl // Default to signin if state parsing fails
          );
        }
      }

      if (err) {
        console.error("Passport error:", err);
        return redirectWithError(
          "oauth_failed",
          "OAuth authentication failed",
          res,
          type,
          redirectUrl
        );
      }

      if (!profile) {
        return redirectWithError(
          "no_profile",
          "No user profile received from Google",
          res,
          type,
          redirectUrl
        );
      }

      const role = stateObj.role || "Member";

      // Extract data from Google profile
      const email = profile._json?.email || profile.emails?.[0]?.value;
      const providerId = profile.id;
      const name = profile.displayName || profile._json?.name || 
                   (profile.name?.givenName && profile.name?.familyName 
                    ? `${profile.name.givenName} ${profile.name.familyName}` 
                    : null);

      if (!email || !providerId || !name) {
        return redirectWithError(
          "missing_data",
          "Missing required profile data from Google",
          res,
          type,
          redirectUrl
        );
      }

      let dbUser;

      if (type === "signin") {
        // Signin flow
        const [linked] = await db.promise().query(
          "SELECT * FROM social_auth WHERE provider = ? AND provider_id = ? LIMIT 1",
          ["google", providerId]
        );

        if (linked.length === 0) {
          // Link doesn't exist - check if user exists by email and create link
          const [existing] = await db.promise().query("SELECT * FROM user WHERE email = ?", [email]);
          
          if (existing.length === 0) {
            return redirectWithError(
              "user_not_found",
              "User not found. Please sign up first.",
              res,
              type,
              redirectUrl
            );
          }

          dbUser = existing[0];
          
          // Check role match
          // if (dbUser.role !== role) {
          //   return redirectWithError(
          //     "role_mismatch",
          //     "Role mismatch. Please use the correct role for sign in.",
          //     res,
          //     type
          //   );
          // }

          // Create social_auth link
          await social_authController.createSocialAuth({
            user_id: dbUser.id,
            provider: "google",
            provider_id: providerId
          });

          // Mark email as verified (Google emails are already verified)
          await db.promise().query(
            "UPDATE user SET email_verification = true, verification_code = NULL WHERE id = ?",
            [dbUser.id]
          );

          return proceedWithUser(dbUser, redirectUrl, res);
        } else {
          // User already linked - get the user from database
          const [users] = await db.promise().query("SELECT * FROM user WHERE id = ?", [linked[0].user_id]);
          
          if (users.length === 0) {
            return redirectWithError(
              "user_not_found",
              "User not found in database",
              res,
              type,
              redirectUrl
            );
          }

          dbUser = users[0];

          // Check role match
          // if (dbUser.role !== role) {
          //   return redirectWithError(
          //     "role_mismatch",
          //     "Role mismatch. Please use the correct role for sign in.",
          //     res,
          //     type,
          //     redirectUrl
          //   );
          // }

          return proceedWithUser(dbUser, redirectUrl, res);
        }
      } else if (type === "signup") {
        // Signup flow
        // Check if social_auth already exists for this provider_id
        const [linked] = await db.promise().query(
          "SELECT * FROM social_auth WHERE provider = ? AND provider_id = ? LIMIT 1",
          ["google", providerId]
        );

        if (linked.length > 0) {
          return redirectWithError(
            "already_linked",
            "This Google account is already linked to an existing account",
            res,
            type,
            redirectUrl
          );
        }

        // Check if user exists by email
        const [existing] = await db.promise().query("SELECT * FROM user WHERE email = ?", [email]);

        if (existing.length > 0) {
          return redirectWithError(
            "email_exists",
            "Email already exists. Please sign in instead.",
            res,
            type,
            redirectUrl
          );
        }

        // Create new user
        const newId = uuidv4();
        const randomPassword = uuidv4(); // Generate random password for social auth users

        // Hash the random password
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Insert new user
        await db.promise().query(
          `INSERT INTO user (id, name, email, password, role, email_verification, verification_code) VALUES (?, ?, ?, ?, ?, true, NULL)`,
          [newId, name, email, hashedPassword, role]
        );

        // Create corresponding record based on role
        if (role === "Administrator" || role === "Super_Admin") {
          await db.promise().query("INSERT INTO administrator (user_id, role) VALUES (?, ?)", [newId, role]);
        } else if (role === "Member") {
          await db.promise().query("INSERT INTO member (user_id) VALUES (?)", [newId]);
        }

        // Create social_auth link
        await social_authController.createSocialAuth({
          user_id: newId,
          provider: "google",
          provider_id: providerId
        });

        // Get the newly created user
        const [newUsers] = await db.promise().query("SELECT * FROM user WHERE id = ?", [newId]);
        
        if (newUsers.length === 0) {
          return redirectWithError(
            "creation_failed",
            "Failed to create user account",
            res,
            type,
            redirectUrl
          );
        }

        dbUser = newUsers[0];
        return proceedWithUser(dbUser, redirectUrl, res);
      } else {
        return redirectWithError(
          "invalid_type",
          "Invalid authentication type. Must be 'signin' or 'signup'",
          res,
          type,
          redirectUrl
        );
      }
    } catch (e) {
      console.error("Callback crash:", e);
      // Try to get type from state if available
      let errorType = "signin";
      if (req.query.state) {
        try {
          const stateObj = JSON.parse(req.query.state);
          errorType = stateObj.type || "signin";
        } catch (parseError) {
          // Keep default signin
        }
      }
      return redirectWithError(
        "server_error",
        "Internal server error during authentication",
        res,
        errorType,
        redirectUrl
      );
    }
  })(req, res, next);
};

// Helper function to proceed with user creation and token generation
function proceedWithUser(user, redirectUrl, res) {
  const safeUser = {
    name: user.name,
    email: user.email,
    user_photo: user.user_photo,
    created_at: user.created_at,
    updated_at: user.updated_at
  };

  const tokenPayload = { id: user.id, email: user.email, role: user.role};
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "24h" });

  const allowedOrigins = [
    "https://meetza-front-end.vercel.app",
    "https://meetza-front-end-admin.vercel.app",
    "http://localhost:3000",
  ];

  try {
    const url = new URL(redirectUrl);
    
    // Check if origin is allowed (for production)
    if (process.env.NODE_ENV === "production" && !allowedOrigins.some(origin => url.origin.includes(origin.replace(/^https?:\/\//, "")))) {
      return res.redirect("http://localhost:3000/login?error=invalid_redirect");
    }

    url.searchParams.set("token", token);
    url.searchParams.set(
      "user",
      encodeURIComponent(JSON.stringify(safeUser))
    );

    return res.redirect(url.toString());
  } catch (urlError) {
    console.error("URL error:", urlError);
    // If redirectUrl is not a valid URL, append token as query params
    const separator = redirectUrl.includes("?") ? "&" : "?";
    return res.redirect(`${redirectUrl}${separator}token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`);
  }
}
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


