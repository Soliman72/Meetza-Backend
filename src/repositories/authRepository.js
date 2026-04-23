const db = require("../config/db");

exports.findByEmail = async (email) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM user WHERE email = ?",
    [email]
  );
  return rows[0];
};

exports.createUser = async (u) => {
  await db.promise().execute(
    `INSERT INTO user (id,name,email,password,role,verification_code,email_verification)
     VALUES (?,?,?,?,?,?,false)`,
    [u.id, u.name, u.email, u.password, u.role, u.verification_code]
  );
};

exports.findByCode = async (email, code) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM user WHERE email = ? AND verification_code = ?",
    [email, code]
  );
  return rows[0];
};

exports.verifyEmail = async (email) => {
  await db.promise().execute(
    "UPDATE user SET email_verification = true, verification_code = NULL WHERE email = ?",
    [email]
  );
};

exports.setResetCode = async (email, code) => {
  await db.promise().execute(
    "UPDATE user SET verification_code = ? WHERE email = ?",
    [code, email]
  );
};

exports.updatePassword = async (email, password) => {
  await db.promise().execute(
    "UPDATE user SET password = ? WHERE email = ?",
    [password, email]
  );
};

exports.deleteByEmail = async (email) => {
  const user = await exports.findByEmail(email);
  if (!user) return;
  await db.promise().execute("DELETE FROM user WHERE id = ?", [user.id]);
};

exports.createSocialSignupUser = async ({
  id,
  name,
  email,
  hashedPassword,
  role,
}) => {
  await db.promise().query(
    `INSERT INTO user (id, name, email, password, role, email_verification, verification_code) VALUES (?, ?, ?, ?, ?, true, NULL)`,
    [id, name, email, hashedPassword, role]
  );
};

exports.insertAdministratorRole = async (user_id, role) => {
  await db.promise().query(
    "INSERT INTO administrator (user_id, role) VALUES (?, ?)",
    [user_id, role]
  );
};

exports.insertMemberForUser = async (user_id) => {
  await db.promise().query("INSERT INTO member (user_id) VALUES (?)", [user_id]);
};

exports.markEmailVerifiedByUserId = async (userId) => {
  await db.promise().query(
    "UPDATE user SET email_verification = true, verification_code = NULL WHERE id = ?",
    [userId]
  );
};

exports.findById = async (id) => {
  const [rows] = await db.promise().execute("SELECT * FROM user WHERE id = ?", [id]);
  return rows[0];
};