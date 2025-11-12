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

    try {
      // parse state
      const stateObj = req.query.state
        ? JSON.parse(req.query.state)
        : { role: "" };
      const role = stateObj.role;

      // extract email and provider id
      let email = null;
      let user;
      if (profile.emails && profile.emails.length > 0)
        email = profile.emails[0].value;

      const providerId = profile.id;
      const name =
        profile.displayName ||
        (
          profile.name &&
          `${profile.name.givenName || ""} ${profile.name.familyName || ""}`
        ).trim() ||
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
          await userController.updateUser(user.id, {
            email_verification: true,
          });
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

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      ${msg}
      <h2>${verificationCode}</h2>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Helper function to proceed with user creation and token generation
function proceedWithUser(user, platform, res) {
  // final: issue JWT
  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  return res.status(200).json({
    success: true,
    message: `${platform} login successful`,
    token,
    user,
  });
}
