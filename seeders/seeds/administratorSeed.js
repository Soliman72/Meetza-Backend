const db = require("../../src/config/db");
const admins = require("../data/administratrorData");
const { ensureAdministratorUser } = require("../utils/seedHelper");

async function seedAdministrators() {
  for (const admin of admins) {
    await ensureAdministratorUser(db, {
      name: admin.name,
      email: admin.email,
      role: admin.role,
      passwordPlain: admin.password ?? undefined,
    });
  }

  console.log("Leaders Seeded");
}

module.exports = seedAdministrators;
