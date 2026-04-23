const db = require("../config/db");

/** Join user row — used by auth middleware (expects an array of rows). */
exports.getAdministratorByUserId = async (userId) => {
  const [rows] = await db.promise().query(
    `SELECT * FROM administrator
     JOIN user ON administrator.user_id = user.id
     WHERE administrator.user_id = ?`,
    [userId]
  );
  return rows;
};

exports.findByUserId = async (userId) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM administrator WHERE user_id = ?",
    [userId]
  );
  return rows[0] || null;
};

exports.findAll = async (whereClause, params = []) => {
  let sql = "SELECT * FROM administrator";
  if (whereClause) sql += ` ${whereClause}`;
  const [rows] = await db.promise().query(sql, params);
  return rows;
};

exports.insert = async (user_id, role) => {
  await db.promise().query(
    "INSERT INTO administrator (user_id, role) VALUES (?, ?)",
    [user_id, role]
  );
  return exports.findByUserId(user_id);
};

exports.updateByUserId = async (user_id, new_user_id, role) => {
  const sql =
    "UPDATE administrator SET user_id = COALESCE(?, user_id), role = COALESCE(?, role) WHERE user_id = ?";
  const [result] = await db.promise().query(sql, [new_user_id, role, user_id]);
  return result.affectedRows;
};

exports.deleteByUserId = async (user_id) => {
  const [result] = await db.promise().query(
    "DELETE FROM administrator WHERE user_id = ?",
    [user_id]
  );
  return result.affectedRows;
};
