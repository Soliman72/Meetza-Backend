require("dotenv").config();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

// Register new user

// Register new user

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

// Register new user with email verification
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !password || !role || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if email already exists
    db.query(
      "SELECT email FROM user WHERE email = ?",
      [email],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        if (rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }

        // Generate unique user ID
        const id = uuidv4();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a 4-digit verification code
        const verificationCode = Math.floor(1000 + Math.random() * 9000);

        // Insert new user (with 'verified' flag set to false)
        const query =
          "INSERT INTO user (id, name, email, password, role, verification_code, email_verification) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(
          query,
          [id, name, email, hashedPassword, role, verificationCode, false],
          (err, result) => {
            if (err) return res.status(500).json({ error: err });

            // Send verification email with 4-digit code
            sendVerificationEmail(
              email,
              verificationCode,
              "<p>Thank you for registering! Please use the following code to verify your email:</p>"
            )
              .then(() => {
                const selectQuery = "SELECT * FROM user WHERE id = ?";
                db.query(selectQuery, [id], (err, rows) => {
                  if (err) return res.status(500).json({ error: err });

                  // Check if the user is an admin or member and insert into respective table
                  if (role === "Administrator") {
                    db.query(
                      "INSERT INTO administrator (user_id) VALUES (?)",
                      [id],
                      (err) => {
                        if (err) return res.status(500).json({ error: err });
                      }
                    );
                  } else if (role === "Member") {
                    db.query(
                      "INSERT INTO member (user_id) VALUES (?)",
                      [id],
                      (err) => {
                        if (err) return res.status(500).json({ error: err });
                      }
                    );
                  }

                  return res.status(201).json({
                    success: true,
                    message:
                      "User registered successfully. Please check your email to verify your account.",
                    data: rows[0],
                  });
                });
              })
              .catch((emailError) => {
                // If email fails to send, delete the user from the database
                db.query("DELETE FROM user WHERE id = ?", [id], (err) => {
                  if (err) return res.status(500).json({ error: err });
                  return res.status(500).json({
                    success: false,
                    message:
                      "Failed to send verification email. User registration has been cancelled.",
                    error: emailError.message,
                  });
                });
              });
          }
        );
      }
    );
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
    const { email, password, remember_me } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    // Check if user exists
    db.query(
      "SELECT * FROM user WHERE email = ?",
      [email],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        if (rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        const user = rows[0];

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
          { expiresIn: remember_me ? "4d" : "24h" }
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
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

// Email Verification Route
exports.verifyEmail = (req, res) => {
  const { code, email } = req.body;

  if (!code || !email) {
    return res.status(400).json({
      success: false,
      message: "Verification code & Email is required",
    });
  }

  // Verify code in the database
  db.query(
    "SELECT * FROM user WHERE verification_code = ? AND email_verification = false AND email = ?",
    [code, email],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });
      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification code",
        });
      }

      const user = rows[0];

      // Mark user as verified
      db.query(
        "UPDATE user SET email_verification = true, verification_code = NULL WHERE email = ?",
        [user.email],
        (err) => {
          if (err) return res.status(500).json({ error: err });

          res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in.",
          });
        }
      );
    }
  );
};

// Forgot password - Step 1: Send reset email
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // Check if the email exists in the database
  db.query("SELECT * FROM user WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    // const user = rows[0];
    const resetCode = Math.floor(1000 + Math.random() * 9000); // Generate a unique token for password reset

    // Store the reset token in the database
    db.query(
      "UPDATE user SET verification_code = ? WHERE email = ?",
      [resetCode, email],
      (err) => {
        if (err) return res.status(500).json({ error: err });

        // Send verification email with 4-digit code
        sendVerificationEmail(
          email,
          resetCode,
          "<p>Thank you for registering! Please use the following code to reset your password:</p>"
        )
          .then(() => {
            return res.status(201).json({
              success: true,
              message: "Please check your email to reset password",
            });
          })
          .catch((emailError) => {
            return res.status(500).json({
              success: false,
              message: "Failed to send verification email",
              error: emailError.message,
            });
          });
      }
    );
  });
};

// Code Verification Route for reset password
exports.verifyCode = (req, res) => {
  const { code, email } = req.body;

  if (!code || !email) {
    return res.status(400).json({
      success: false,
      message: "Verification code & Email is required",
    });
  }

  // Verify code in the database
  db.query(
    "SELECT * FROM user WHERE verification_code = ? AND email = ?",
    [code, email],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });
      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification code",
        });
      }

      const user = rows[0];

      // Mark user as verified
      db.query(
        "UPDATE user SET verification_code = NULL WHERE email = ?",
        [user.email],
        (err) => {
          if (err) return res.status(500).json({ error: err });

          res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now reset password.",
          });
        }
      );
    }
  );
};
// Code Verification Route for reset password
exports.resetPassword = async (req, res) => {
  const { is_verifyed, email, new_password } = req.body;

  if (!is_verifyed || !new_password || !email) {
    return res.status(400).json({
      success: false,
      message: "New password & Email is required",
    });
  }

  if (is_verifyed === "true") {
    // Verify code in the database
    db.query(
      "SELECT * FROM user WHERE email = ?",
      [email],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        if (rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid email!",
          });
        }

        const user = rows[0];
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Mark user as verified
        db.query(
          "UPDATE user SET password = ? WHERE email = ?",
          [hashedPassword, user.email],
          (err) => {
            if (err) return res.status(500).json({ error: err });

            res.status(200).json({
              success: true,
              message: "password change successfully. You can now login.",
            });
          }
        );
      }
    );
  } else {
    return res.status(400).json({
      success: false,
      message: "is_verifyed is false",
    });
  }
};
