const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const passport = require("passport");
const userController = require("./userController");
const social_authController = require("./social_authController");

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
    // Verify code in the databaseeeee
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

// Social Authentication
exports.socialAuth = (req, res, next) => {
  const role = req.query.role; // 'Administrator' or 'Member'
  const state = JSON.stringify({ role });

  const scope = ["email", "profile"];
  passport.authenticate("google", { scope, session: false, state })(
    req,
    res,
    next
  );
};

// Social Authentication Callback
exports.socialAuthCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, profile) => {
    if (err) {
      console.error("Passport error:", err);
      return res.status(500).json({
        success: false,
        message: `${"google"} callback error`,
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
      const findProvQ =
        "SELECT * FROM social_auth WHERE provider = ? AND provider_id = ? LIMIT 1";
      db.query(findProvQ, ["google", providerId], (err, rowsProv) => {
        if (err) {
          console.error("Error querying provider:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database query error" });
        }

        if (rowsProv.length > 0) {
          // linked provider exists -> get user
          // const userId = rowsProv[0].user_id;
          db.query(
            "SELECT * FROM user WHERE email = ? LIMIT 1",
            [email],
            (err, users) => {
              if (err) {
                console.error("Error querying user:", err);
                return res
                  .status(500)
                  .json({ success: false, message: "Database query error" });
              }
              user = users[0];
              proceedWithUser(user, "google", res);
            }
          );
        } else if (email) {
          // 2 If user with email exists -> auto-link
          db.query(
            "SELECT * FROM user WHERE email = ? LIMIT 1",
            [email],
            async (err, rowsEmail) => {
              if (err) {
                console.error("Error querying email:", err);
                return res
                  .status(500)
                  .json({ success: false, message: "Database query error" });
              }

              if (rowsEmail.length > 0) {
                user = rowsEmail[0];
                // insert into social_auth (ignore duplicate errors)
                await this.social_authController.createSocialAuth({
                  user_id: user.id,
                  provider: "google",
                  provider_id: providerId,
                });

                // ensure email verification true
                await userController.updateUser(user.id, { email_verification: true });
                // db.query(
                //   "UPDATE users SET email_verification = ? WHERE id = ?",
                //   [true, user.id],
                //   (err) => {
                //     if (err) {
                //       console.error("Error updating email verification:", err);
                //     }
                //   }
                // );

                proceedWithUser(user, "google", res);

                // Proceed to create token and response
              } else {
                // 3 Create new user and link provider
                const id = uuidv4();
                await userController.createUser({
                  id,
                  name,
                  email,
                  password: uuidv4(), // random password
                  role,
                  verification_code: null,
                  email_verification: true,
                }, res);
                await this.social_authController.createSocialAuth({
                  user_id: id,
                  provider: "google",
                  provider_id: providerId,
                });
                // const insertUserQuery = `INSERT INTO user (id, name, email, role, verification_code , email_verification) VALUES (?, ?, ?, ?, ?, ?)`;
                // db.query(
                //   insertUserQuery,
                //   [id, name, email, role, 0, true],
                //   (err) => {
                //     if (err) {
                //       console.error("Error inserting new user:", err);
                //       return res.status(500).json({
                //         success: false,
                //         message: "Error creating user",
                //       });
                //     }

                //     if (role === "Administrator") {
                //       db.query(
                //         "INSERT INTO administrator (user_id) VALUES (?)",
                //         [id],
                //         (err) => {
                //           if (err) {
                //             console.error(
                //               "Error inserting into administrator:",
                //               err
                //             );
                //           }
                //         }
                //       );
                //     } else if (role === "Member") {
                //       db.query(
                //         "INSERT INTO member (user_id) VALUES (?)",
                //         [id],
                //         (err) => {
                //           if (err) {
                //             console.error("Error inserting into member:", err);
                //           }
                //         }
                //       );
                //     }

                //     const insertProviderQ = `INSERT INTO social_auth (user_id, provider, provider_id) VALUES (?, ?, ?)`;
                //     db.query(
                //       insertProviderQ,
                //       [id, "google", providerId],
                //       (err) => {
                //         if (err) {
                //           console.error("Error inserting social auth:", err);
                //         }
                //       }
                //     );

                    // Fetch new user details
                    db.query(
                      "SELECT * FROM user WHERE email = ?",
                      [email],
                      (err, newRows) => {
                        if (err) {
                          console.error("Error fetching new user:", err);
                          return res.status(500).json({
                            success: false,
                            message: "Error fetching new user",
                          });
                        }

                        user = newRows[0];
                        proceedWithUser(user, "google", res);

                        // Continue with JWT token creation or response here
                      }
                    );
                //   }
                // );
              }
            }
          );
        } else {
          console.error("Social callback error:", error);
          return res.status(500).json({
            success: false,
            message: "There is no email!",
          });
        }
      });
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
