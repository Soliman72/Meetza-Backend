// src/repositories/likeRepository.js

const db = require("../config/db");

exports.getVideo = async (video_id) => {
  const [rows] = await db.promise().query(
    `SELECT v.id, v.title, v.group_id, g.group_name, ga.user_id AS group_admin_id 
     FROM video v 
     JOIN \`group\` g ON g.id = v.group_id 
     LEFT JOIN group_admin ga ON ga.group_id = g.id AND ga.role = 'OWNER'
     WHERE v.id = ?`,
    [video_id]
  );
  return rows[0];
};

exports.getExistingLike = async (user_id, video_id) => {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM `like` WHERE member_id = ? AND video_id = ?", [
      user_id,
      video_id,
    ]);
  return rows[0];
};

exports.insertLike = async (id, user_id, video_id, like_type) => {
  await db.promise().query(
    "INSERT INTO `like` (id, member_id, video_id, like_type) VALUES (?, ?, ?, ?)",
    [id, user_id, video_id, like_type]
  );
};

exports.updateLike = async (id, like_type) => {
  await db
    .promise()
    .query("UPDATE `like` SET like_type = ? WHERE id = ?", [like_type, id]);
};

exports.updateLikeByUser = async (user_id, video_id, like_type) => {
  await db
    .promise()
    .query(
      "UPDATE `like` SET like_type = ? WHERE member_id = ? AND video_id = ?",
      [like_type, user_id, video_id]
    );
};

exports.deleteLike = async (user_id, video_id) => {
  const [res] = await db
    .promise()
    .query("DELETE FROM `like` WHERE member_id = ? AND video_id = ?", [
      user_id,
      video_id,
    ]);
  return res.affectedRows;
};

exports.getCounts = async (video_id) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT like_type, COUNT(*) as count FROM `like` WHERE video_id = ? GROUP BY like_type",
      [video_id]
    );
  return rows;
};

exports.getLikesByVideo = async (video_id) => {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM `like` WHERE video_id = ?", [video_id]);
  return rows;
};

exports.getLikesByUser = async (user_id) => {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM `like` WHERE member_id = ?", [user_id]);
  return rows;
};

exports.getUserName = async (user_id) => {
  const [rows] = await db
    .promise()
    .query("SELECT name FROM user WHERE id = ?", [user_id]);
  return rows[0]?.name || "Someone";
};