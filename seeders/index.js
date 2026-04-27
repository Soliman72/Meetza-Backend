require("dotenv").config();
const seedAdmins = require("./seeds/administratorSeed");
const seedGroups = require("./seeds/groupSeed");
const seedCompany = require("./seeds/companySeed");

async function runSeeds() {
  try {
    await seedCompany();
    await seedAdmins();
    await seedGroups();

    console.log("Seeding Done");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runSeeds();