const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

async function insertIfNotExists(db, data) {
  const [rows] = await db.promise().query(`SELECT * FROM user WHERE email = ?`, [
    data.email,
  ]);

  if (rows.length === 0) {
    const keys = Object.keys(data);
    const values = Object.values(data);

    await db.promise().query(
      `INSERT INTO user (${keys.map((k) => `\`${k}\``).join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
      values
    );
  }
}

/**
 * Creates or finds a user and ensures a row in `administrator` (Leader / Super_Admin).
 * @returns {Promise<string>} user id
 */
async function ensureAdministratorUser(
  db,
  { name, email, role, passwordPlain = "Shahd@123456" }
) {
  const [existingRows] = await db.promise().query(
    "SELECT id FROM user WHERE email = ?",
    [email]
  );

  let userId;
  if (existingRows.length > 0) {
    userId = existingRows[0].id;
  } else {
    userId = uuidv4();
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    await db.promise().query(
      "INSERT INTO user (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [userId, name, email, hashedPassword, role]
    );
  }

  await db.promise().query(
    `INSERT INTO administrator (user_id, role)
     SELECT ?, ? FROM DUAL
     WHERE ? NOT IN (SELECT user_id FROM administrator)`,
    [userId, role, userId]
  );
  return userId;
}

module.exports = { insertIfNotExists, ensureAdministratorUser };
