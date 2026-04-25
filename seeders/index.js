require("dotenv").config();
const seedAdmins = require("./seeds/administratorSeed");
const seedGroups = require("./seeds/groupSeed");

async function runSeeds() {
  try {
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