require("dotenv").config();
const seedAdmins = require("./seeds/administratorSeed");
const seedGroups = require("./seeds/groupSeed");
const seedDomains = require("./seeds/domainSeed");

async function runSeeds() {
  try {
    await seedAdmins();
    await seedGroups();
    await seedDomains();

    console.log("Seeding Done");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runSeeds();