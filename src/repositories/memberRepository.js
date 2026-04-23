const db = require("../config/db");

exports.findAll = async () => {
  const [rows] = await db.promise().query("SELECT * FROM member");
  return rows;
};

exports.findByUserId = async (userId) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM member WHERE user_id = ?",
    [userId]
  );
  return rows[0] || null;
};

exports.insert = async (user_id) => {
  await db.promise().query("INSERT INTO member (user_id) VALUES (?)", [user_id]);
  return exports.findByUserId(user_id);
};

exports.updateUserId = async (oldUserId, newUserId) => {
  const [result] = await db.promise().query(
    "UPDATE member SET user_id = ? WHERE user_id = ?",
    [newUserId, oldUserId]
  );
  return result.affectedRows;
};

exports.deleteByUserId = async (userId) => {
  const [result] = await db.promise().query(
    "DELETE FROM member WHERE user_id = ?",
    [userId]
  );
  return result.affectedRows;
};
