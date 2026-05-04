const { v4: uuidv4 } = require("uuid");
const db = require("../../src/config/db");
const groups = require("../data/groupData");
const { ensureAdministratorUser } = require("../utils/seedHelper");

async function seedGroups() {
  for (const group of groups) {
    const admins = Array.isArray(group.admins) ? group.admins : group.admin ? [group.admin] : [];
    if (admins.length === 0) {
      throw new Error(
        `groupData: group "${group.group_name || "?"}" must include admin/admins with name and email`
      );
    }
    const seenEmails = new Set();

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

    for (let idx = 0; idx < admins.length; idx += 1) {
      const a = admins[idx];
      if (!a?.email || !a?.name) {
        throw new Error(
          `groupData: group "${group.group_name || "?"}" has admin missing name/email`
        );
      }

      const emailKey = String(a.email).trim().toLowerCase();
      if (seenEmails.has(emailKey)) continue;
      seenEmails.add(emailKey);

      const leaderRole = a.role || "Administrator";
      const userId = await ensureAdministratorUser(db, {
        name: a.name,
        email: a.email,
        role: leaderRole,
        passwordPlain: a.password ?? undefined,
      });

      const [existingGa] = await db.promise().query(
        "SELECT id FROM group_admin WHERE group_id = ? AND user_id = ?",
        [groupId, userId]
      );

      if (existingGa.length === 0) {
        const groupAdminRole = idx === 0 ? "OWNER" : "ADMIN";
        await db.promise().query(
          `INSERT INTO group_admin (id, group_id, user_id, role, assigned_by)
           VALUES (?, ?, ?, ?, NULL)`,
          [uuidv4(), groupId, userId, groupAdminRole]
        );
      }
    }
  }

  console.log("Groups Seeded");
}

module.exports = seedGroups;
