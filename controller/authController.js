const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// Register new user
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

        // Insert new user
        const query =
          "INSERT INTO user (id, name, email , password, role) VALUES (? , ?, ?, ?, ?)";
        db.query(
          query,
          [id, name, email, hashedPassword, role],
          (err, result) => {
            if (err) return res.status(500).json({ error: err });
            const selectQuery = "SELECT * FROM user WHERE id = ?";
            db.query(selectQuery, [id], (err, rows) => {
              if (err) return res.status(500).json({ error: err });
              res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: rows[0],
              });

              // check if member or admin
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
            }
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
