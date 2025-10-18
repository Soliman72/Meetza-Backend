const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

// Register new user
// Helper function to send the verification email
const sendVerificationEmail = (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "shahd01278039699@gmail.com", // Use your actual email
      pass: "Shahd2632005@", // Use your actual email password
    },
  });

  const mailOptions = {
    from: "shahd01278039699@gmail.com",
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <p>Thank you for registering! Please use the following code to verify your email:</p>
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

    const id = uuidv4();

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
            sendVerificationEmail(email, verificationCode)
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
    const { email, password } = req.body;

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
          { expiresIn: "24h" }
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
