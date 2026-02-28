const db = require("../config/db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const administratorController = require("./administratorController");
const memberController = require("./memberController");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");
const { upload, uploadToCloudinary } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");
const { success: resSuccess, error: resError } = require("../dto");
const userDto = require("../dto/userDto");

// Create
exports.createUser = async (data) => {
  try {
    const {
      name,
      email,
      password,
      role,
      verification_code,
      email_verification,
    } = data.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !role ||
      !verification_code ||
      email_verification === undefined ||
      email_verification === null
    ) {
      throw new Error("One or more fields are required");
    }

    // Check if user already exists
    const [exists] = await db
      .promise()
      .query("SELECT * FROM user WHERE email = ?", [email]);
    if (exists.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Generate a unique ID for the new user
    const id = uuidv4();

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user record
    const sql =
      "INSERT INTO user (id, name, email, password, role, verification_code, email_verification) VALUES (?, ?, ?, ?, ?, ?, ?)";
    await db
      .promise()
      .query(sql, [
        id,
        name,
        email,
        hashedPassword,
        role,
        verification_code,
        email_verification,
      ]);

    // Create corresponding record based on role
    if (role === "Administrator" || role === "Super_Admin") {
      const reqadmin = { body: { user_id: id, role } };
      await administratorController.createAdministrator(reqadmin); // No res passed here
    } else if (role === "Member") {
      const reqmember = { body: { user_id: id } };
      await memberController.createMember(reqmember); // No res passed here
    }

    // Return data to the caller instead of sending response here
    return { id, name, email, role };
  } catch (err) {
    throw err;
  }
};

// Read all
exports.getAllUsers = async (req, res) => {
  try {
    const { name } = req.query;
    let sql = "SELECT * FROM user";

    let params = [];
    let query = sql;
    // Apply ownership filter for regular admins

    const ownershipFilter = getOwnershipFilter(req, "id");
    if (ownershipFilter.whereClause) {
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    if (ownershipFilter.whereClause && name) {
      query += " AND name LIKE ?";
      params.push(`%${name}%`);
    } else {
      if (name) {
        query += " WHERE name LIKE ?";
        params.push(`%${name}%`);
      }
    }

    console.log(query);

    const [rows] = await db.promise().query(query, params);
    res.status(200).json(resSuccess(userDto.toPublicListWithRole(rows)));
  } catch (err) {
    res.status(500).json(resError("Database error", { error: err.message }));
  }
};

// Read by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json(resError("id is required"));
    }
    const [rows] = await db
      .promise()
      .query("SELECT * FROM user WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json(resError("User not found"));
    }
    res.status(200).json(resSuccess(userDto.toPublic(rows[0])));
  } catch (err) {
    res.status(500).json(resError("Database error", { error: err.message }));
  }
};


// get by Email
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json(resError("email is required"));
    }
    const [rows] = await db
      .promise()
      .query("SELECT * FROM user WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json(resError("User not found"));
    }
    res.status(200).json(resSuccess(userDto.toPublicWithRole(rows[0])));
  } catch (err) {
    res.status(500).json(resError("Database error", { error: err.message }));
  }
};

// Update
exports.updateUser = async (req, res) => {
  // Apply multer upload middleware to handle file uploads
  upload.fields([{ name: "user_photo", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err) {
        return res.status(400).json(resError(err.message));
      }

      try {
        const { id } = req.params;
        const {
          name,
          email,
          password,
          role,
          verification_code,
          email_verification,
          user_photo,
        } = req.body;

        if (!id) {
          return res.status(400).json(resError("id is required"));
        }
        if (
          !name &&
          !email &&
          !password &&
          !role &&
          !verification_code &&
          !email_verification &&
          !user_photo &&
          !req.files?.user_photo
        ) {
          return res.status(400).json(resError("At least one field is required to update"));
        }

        // Handle file upload to Cloudinary
        let user_photo_url;
        if (req.files && req.files.user_photo) {
          const user_photo = req.files.user_photo[0];
          validateFileType(user_photo, "image");

          user_photo_url = await uploadToCloudinary(user_photo, "posters");
        } else if (user_photo) {
          validateFileType(user_photo, "image");
          user_photo_url = user_photo;
        }

        await db
          .promise()
          .query(
            "UPDATE user SET name = COALESCE(?, name), email = COALESCE(?, email), password = COALESCE(?, password), role = COALESCE(?, role), verification_code = COALESCE(?, verification_code), email_verification = COALESCE(?, email_verification), user_photo = COALESCE(?, user_photo) WHERE id = ?",
            [
              name,
              email,
              password,
              role,
              verification_code,
              email_verification,
              user_photo_url,
              id,
            ]
          );
        res.status(200).json(resSuccess(null, "User updated successfully"));
      } catch (err) {
        res.status(500).json(resError("Database error", { error: err.message }));
      }
    }
  );
};

// Delete
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json(resError("id is required"));
    }
    const sql = "DELETE FROM user WHERE id = ?";
    const [result] = await db.promise().query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json(resError("User not found"));
    }
    res.status(200).json(resSuccess(null, "User deleted successfully"));
  } catch (err) {
    res.status(500).json(resError("Database error", { error: err.message }));
  }
};
