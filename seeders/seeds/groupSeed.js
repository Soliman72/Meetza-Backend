const { v4: uuidv4 } = require("uuid");
const db = require("../../src/config/db");
const groups = require("../data/groupData");

async function seedGroups() {
  const [positions] = await db.promise().query(`SELECT id FROM position LIMIT 1`);

  if (!positions.length) {
    console.log("No positions found, skipping group seeds");
    return;
  }

  const positionId = positions[0].id;

  for (let group of groups) {
    await db.promise().query(`
      INSERT INTO \`group\`
      (id, group_name, description, position_id, year, semester)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM \`group\` WHERE group_name = ?
      )
    `, [
      uuidv4(),
      group.group_name,
      group.description,
      positionId,
      group.year,
      group.semester,
      group.group_name
    ]);
  }

  console.log("Groups Seeded");
}

module.exports = seedGroups;