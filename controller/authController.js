const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const passport = require("passport");
const userController = require("./userController");
const social_authController = require("./social_authController");
const axios = require("axios");
const { success: resSuccess, error: resError, authDto } = require("../dto");
const { requiresCaptcha, recordFailedAttempt, clearAttempts, getAttemptsInfo } = require("../services/loginAttemptsService");
const { sendVerificationEmail } = require("../services/authEmailService");
const { redirectWithError, proceedWithUser } = require("../services/authOAuthService");

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

    // After 3 failed attempts → reCAPTCHA required
    if (requiresCaptcha(email) && !captchaToken) {
      const attemptInfo = getAttemptsInfo(email);
      return res.status(429).json({
        success: false,
        message: "Too many failed login attempts. Please complete the reCAPTCHA and try again.",
        requiresCaptcha: true,
        remaining: attemptInfo.remaining,           // attempts left (0 = must show reCAPTCHA)
        requiresCaptchaAttempt: attemptInfo.requiresCaptcha,
      });
    }

    // Validate and verify reCAPTCHA token (when sent)
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
      recordFailedAttempt(email);
      const attemptInfo = getAttemptsInfo(email);
      return res.status(401).json(resError( "Invalid email or password. You have " + attemptInfo.remaining + " attempts left before reCAPTCHA is required."));
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
      recordFailedAttempt(email);
      const attemptInfo = getAttemptsInfo(email);
      return res.status(401).json(resError("Invalid email or password. You have " + attemptInfo.remaining + " attempts left before reCAPTCHA is required."));
    }

    // Login success → clear failed attempt counter
    clearAttempts(email);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        user_photo: user.user_photo,
      },
      process.env.JWT_SECRET,
      { expiresIn: remember_me === "true" ? "4d" : "24h" }
    );

    res.status(200).json(resSuccess(authDto.loginResponse(token), "Login successful"));
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
