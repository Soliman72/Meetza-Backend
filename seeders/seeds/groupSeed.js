const { v4: uuidv4 } = require("uuid");
const db = require("../../src/config/db");
const groups = require("../data/groupData");

async function seedGroups() {
  
  for (let group of groups) {
    await db.promise().query(`
      INSERT INTO \`group\`
      (id, group_name, description, year, semester, group_photo)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM \`group\` WHERE group_name = ?
      )
    `, [
      uuidv4(),
      group.group_name,
      group.description,
      group.year,
      group.semester,
      group.group_photo,
      group.group_name
    ]);
  }

  console.log("Groups Seeded");
}

module.exports = seedGroups;