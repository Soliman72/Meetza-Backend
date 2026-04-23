const db = require("../config/db");

exports.insert = async (id, title, administrator_id) => {
  await db.promise().query(
    "INSERT INTO `position` (id, title, administrator_id) VALUES (?, ?, ?)",
    [id, title, administrator_id]
  );
};

exports.findAll = async (whereClause, params, titleLike) => {
  let query = "SELECT * FROM position";
  const p = [...params];
  if (whereClause) {
    query += ` ${whereClause}`;
  }
  if (titleLike) {
    query += whereClause ? " AND title LIKE ?" : " WHERE title LIKE ?";
    p.push(`%${titleLike}%`);
  }
  const [rows] = await db.promise().query(query, p);
  return rows;
};

exports.findByIdScoped = async (id, administratorId, isSuperAdmin) => {
  let sql = "SELECT * FROM position WHERE id = ?";
  const params = [id];
  if (!isSuperAdmin) {
    sql += " AND administrator_id = ?";
    params.push(administratorId);
  }
  const [rows] = await db.promise().query(sql, params);
  return rows[0] || null;
};

exports.updateTitle = async (id, title) => {
  const [result] = await db.promise().query(
    "UPDATE position SET title = ? WHERE id = ?",
    [title, id]
  );
  return result.affectedRows;
};

exports.deleteById = async (id) => {
  const [result] = await db.promise().query("DELETE FROM position WHERE id = ?", [
    id,
  ]);
  return result.affectedRows;
};

exports.administratorExists = async (user_id) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM administrator WHERE user_id = ?",
    [user_id]
  );
  return rows.length > 0;
};
