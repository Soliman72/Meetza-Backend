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
// exports.login = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // Validate required fields
//     if (!username || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Username and password are required",
//       });
//     }

//     // Check if user exists
//     db.query(
//       "SELECT * FROM Users WHERE username = ?",
//       [username],
//       async (err, rows) => {
//         if (err) return res.status(500).json({ error: err });
//         if (rows.length === 0) {
//           return res.status(401).json({
//             success: false,
//             message: "Invalid username or password",
//           });
//         }

//         const user = rows[0];

//         // Compare password
//         const validPassword = await bcrypt.compare(password, user.password);
//         if (!validPassword) {
//           return res.status(401).json({
//             success: false,
//             message: "Invalid username or password",
//           });
//         }

//         // Generate JWT token
//         const token = jwt.sign(
//           {
//             id: user.id,
//             username: user.username,
//           },
//           process.env.JWT_SECRET,
//           { expiresIn: "24h" }
//         );

//         // Create a fake res object to capture the result
//         const fakeRes = {
//           status: function (code) {
//             this.statusCode = code;
//             return this;
//           },
//           json: function (data) {
//             this.data = data;
//             return this;
//           },
//         };

//         // login to studio automated also
//         const studioLoginResult = await UniversalController.authenticate(
//           {
//             body: {
//               username: "hello@weareaugustus.com",
//               password: "Augustus@123",
//             },
//             query: {
//               system: "studio-automated",
//             },
//           },
//           fakeRes
//         );
//         let studioAutomatedToken = null;
//         if (
//           fakeRes.data &&
//           fakeRes.data.data &&
//           fakeRes.data.data.access_token
//         ) {
//           studioAutomatedToken = fakeRes.data.data.access_token;
//           // Store the token in the Users table
//           db.query("UPDATE Users SET studio_automated_token = ? WHERE id = ?", [
//             studioAutomatedToken,
//             user.id,
//           ]);
//         }

//         res.status(200).json({
//           success: true,
//           message: "Login successful",
//           data: {
//             token,
//             user: {
//               id: user.id,
//               username: user.username,
//               role_id: user.role_id,
//             },
//             studio_automated_token: studioAutomatedToken, // for demonstration
//           },
//         });
//       }
//     );
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error logging in",
//       error: error.message,
//     });
//   }
// };
