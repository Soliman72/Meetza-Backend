const { v4: uuidv4 } = require("uuid");
const db = require("../../src/config/db");
const admins = require("../data/administratrorData");
const { insertIfNotExists } = require("../utils/seedHelper");

async function seedAdministrators() {
  for (let admin of admins) {
    const id = uuidv4();

    await insertIfNotExists(db, {
      id,
      name: admin.name,
      email: admin.email,
      password: "Shahd@123456",
      role: admin.role
    });

    await db.promise().query(`
      INSERT INTO administrator (user_id, role)
      SELECT id, role FROM user
      WHERE email = ?
      AND id NOT IN (SELECT user_id FROM administrator)
    `, [admin.email]);
  }

  console.log("Administrators Seeded");
}

module.exports = seedAdministrators;