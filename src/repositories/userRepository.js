const db = require("../config/db");
const { assertSafeSqlFragment } = require("../utils/sqlSafety");

exports.findAll = async (name, ownershipFilter) => {
  let query = "SELECT * FROM user";
  let params = [];

  if (ownershipFilter?.whereClause) {
    assertSafeSqlFragment(ownershipFilter.whereClause, "ownershipFilter.whereClause");
    query += " " + ownershipFilter.whereClause;
    params.push(...ownershipFilter.params);
  }

  if (name) {
    query += query.includes("WHERE") ? " AND name LIKE ?" : " WHERE name LIKE ?";
    params.push(`%${name}%`);
  }

  const [rows] = await db.promise().execute(query, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.promise().execute("SELECT * FROM user WHERE id = ?", [id]);
  return rows[0];
};

exports.findByEmail = async (email) => {
  const [rows] = await db.promise().execute("SELECT * FROM user WHERE email = ?", [email]);
  return rows[0];
};// true

exports.findPositionsByUserId = async (userId) => {
  const [rows] = await db.promise().execute(
    `SELECT p.id, p.title
      FROM position p
      WHERE p.administrator_id = ?
      ORDER BY p.title ASC`,
    [userId]
  );

  return rows;
};

exports.getEmailById = async (id) => {
  const [rows] = await db.promise().execute("SELECT email FROM user WHERE id = ?", [id]);
  return rows[0];
};

exports.create = async (user) => {
  const sql = `
    INSERT INTO user (id, name, email, password, role, verification_code, email_verification, theme)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db.promise().execute(sql, [
    user.id,
    user.name,
    user.email,
    user.password,
    user.role,
    user.verification_code,
    user.email_verification,
    user.theme || "light",
  ]);

  if (user.role === "Administrator" || user.role === "Super_Admin") {
    await db.promise().execute("INSERT INTO administrator (user_id) VALUES (?)", [user.id]);
  } else if (user.role === "Member") {
    await db.promise().execute("INSERT INTO member (user_id) VALUES (?)", [user.id]);
  }
};

exports.update = async (id, data) => {
  const sql = `
    UPDATE user SET
    name = COALESCE(?, name),
    email = COALESCE(?, email),
    password = COALESCE(?, password),
    role = COALESCE(?, role),
    verification_code = COALESCE(?, verification_code),
    email_verification = COALESCE(?, email_verification),
    user_photo = COALESCE(?, user_photo),
    theme = COALESCE(?, theme)
    WHERE id = ?
  `;

  const [result] = await db.promise().execute(sql, [
    data.name ?? null,
    data.email ?? null,
    data.password ?? null,
    data.role ?? null,
    data.verification_code ?? null,
    data.email_verification ?? null,
    data.user_photo ?? null,
    data.theme ?? null,
    id,
  ]);

  return result.affectedRows;
};

exports.delete = async (id) => {
  const [result] = await db.promise().execute("DELETE FROM user WHERE id = ?", [id]);
  return result.affectedRows > 0;
};