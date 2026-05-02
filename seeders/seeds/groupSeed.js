const { v4: uuidv4 } = require("uuid");
const db = require("../../src/config/db");
const groups = require("../data/groupData");
const { ensureAdministratorUser } = require("../utils/seedHelper");

async function seedGroups() {
  for (const group of groups) {
    const a = group.admin;
    if (!a?.email || !a?.name) {
      throw new Error(
        `groupData: group "${group.group_name || "?"}" must include admin.name and admin.email`
      );
    }

    const leaderRole = a.role || "Administrator";
    const userId = await ensureAdministratorUser(db, {
      name: a.name,
      email: a.email,
      role: leaderRole,
      passwordPlain: a.password ?? undefined,
    });

    const [existingGroup] = await db.promise().query(
      "SELECT id FROM `group` WHERE group_name = ?",
      [group.group_name]
    );

    let groupId;
    if (existingGroup.length > 0) {
      groupId = existingGroup[0].id;
    } else {
      groupId = uuidv4();
      await db.promise().query(
        `INSERT INTO \`group\`
        (id, group_name, description, year, semester, group_photo)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          group.group_name,
          group.description ?? null,
          group.year,
          group.semester,
          group.group_photo ?? null,
        ]
      );
    }

    const [existingGa] = await db.promise().query(
      "SELECT id FROM group_admin WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );

    if (existingGa.length === 0) {
      await db.promise().query(
        `INSERT INTO group_admin (id, group_id, user_id, role, assigned_by)
         VALUES (?, ?, ?, 'OWNER', NULL)`,
        [uuidv4(), groupId, userId]
      );
    }
  }

  console.log("Groups Seeded");
}

module.exports = seedGroups;
