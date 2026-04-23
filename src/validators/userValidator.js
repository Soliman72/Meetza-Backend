const validator = require("validator");
const sanitize = require("sanitize-html");

exports.validateCreateUser = (req, res, next) => {
  const { name, email, password, role } = req.body;

  // required
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // sanitize name
  name = sanitize(name);

  // email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  // password strength
  if (password.length < 6) {
    return res.status(400).json({ message: "Password too short" });
  }

  // role whitelist
  const allowedRoles = ["Administrator", "Super_Admin", "Member"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  next();
};

const ALLOWED_ROLES = ["Administrator", "Super_Admin", "Member"];

exports.validateCreateUserBody = (body) => {
  const { name, email, password, role } = body || {};
  if (!name || !email || !password || !role) {
    throw new Error("Missing required fields");
  }
  if (!validator.isEmail(String(email))) {
    throw new Error("Invalid email");
  }
  if (String(password).length < 6) {
    throw new Error("Password too short");
  }
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Invalid role");
  }
};

exports.validateUserIdParam = (id) => {
  if (!id || String(id).trim() === "") {
    throw new Error("id required");
  }
};

exports.validateUserEmailParam = (email) => {
  if (!email || String(email).trim() === "") {
    throw new Error("email required");
  }
};