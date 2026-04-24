const db = require("../config/db");
const { normalizeToArray, normalizeAndValidate } = require("../utils/normalize");

exports.createGroup = async (data) => {
  const sql = `
    INSERT INTO \`group\` 
    (id, group_name, description, group_photo, year, semester)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await db.promise().execute(sql, [
    data.id,
    data.group_name,
    data.description ?? null,
    data.group_photo ?? null,
    data.year,
    data.semester,
  ]);
};

exports.findById = async (id) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM `group` WHERE id = ?",
    [id]
  );
  return rows[0];
};

exports.validateAdminIds = async (adminIds) => {
  if (!Array.isArray(adminIds) || adminIds.length === 0) return [];

  const cleanIds = [...new Set(adminIds.map((id) => String(id).trim()).filter(Boolean))];
  if (!cleanIds.length) return [];

  const placeholders = cleanIds.map(() => "?").join(",");
  const [rows] = await db.promise().execute(
    `SELECT user_id FROM administrator WHERE user_id IN (${placeholders})`,
    cleanIds
  );

  return rows.map((r) => r.user_id);
};

exports.getAllGroups = async (req) => {
  let sql = `SELECT 
               g.*,
               CASE
                 WHEN ga.user_id IS NOT NULL OR gm_self.member_id IS NOT NULL THEN 1
                 ELSE 0
               END AS is_joined
             FROM \`group\` g 
             LEFT JOIN group_admin ga ON ga.group_id = g.id AND ga.user_id = ?
             LEFT JOIN group_membership gm_self ON gm_self.group_id = g.id AND gm_self.member_id = ?`;

  const params = [req.user.id, req.user.id];
  let where = [];

  if (req.user.role === "Administrator") {
    where.push("ga.user_id IS NOT NULL");
  }

  if (req.query.name) {
    where.push("g.group_name LIKE ?");
    params.push(`%${req.query.name}%`);
  }

  const yearsArray = normalizeToArray(req.query.year)
    .map((y) => y.toString())
    .filter((y) => ["1", "2", "3", "4"].includes(y));

  if (yearsArray.length) {

    where.push(` g.year IN (${yearsArray.map(() => "?").join(",")})`);
    params.push(...yearsArray);
  }

  const semestersArray = normalizeAndValidate(req.query.semester, [
    "Fall",
    "Spring",
    "Summer",
  ]);

  if (semestersArray.length) {
    where.push(` g.semester IN (${semestersArray.map(() => "?").join(",")})`);
    params.push(...semestersArray);
  }


  if (where.length) {
    sql += " WHERE " + where.join(" AND ");
  }

  const [rows] = await db.promise().execute(sql, params);
  return { rows };
};

exports.getGroupById = async (id) => {
  const [rows] = await db.promise().execute("SELECT * FROM `group` WHERE id = ?", [id]);

  return rows[0];
};


exports.getAdminsByGroupIds = async (groupIds) => {
  if (!Array.isArray(groupIds) || groupIds.length === 0) return [];

  const safeIds = groupIds
    .filter((id) => typeof id === "string" || typeof id === "number")
    .map((id) => id.toString().trim())
    .filter(Boolean);

  if (safeIds.length === 0) return [];

  const placeholders = safeIds.map(() => "?").join(",");
  const [admins] = await db.promise().execute(
    `SELECT 
          ga.group_id, ga.user_id, ga.role, ga.assigned_by, ga.created_at,
          u.name, u.email, u.user_photo
       FROM group_admin ga
       JOIN user u ON u.id = ga.user_id
       WHERE ga.group_id IN (${placeholders})
       ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC`,
    safeIds
  );

  return admins;
};

exports.updateGroup = async (id, updates) => {
  const sql = `UPDATE \`group\` SET 
        group_name = COALESCE(?, group_name), 
        description = COALESCE(?, description),
        group_photo = COALESCE(?, group_photo),
        year = COALESCE(?, year),
        semester = COALESCE(?, semester)
        WHERE id = ?`;

  const [result] = await db
    .promise()
    .execute(sql, [
      updates.group_name,
      updates.description,
      updates.group_photo,
      updates.year,
      updates.semester,
      id,
    ]);

};

exports.delete = async (id) => {
  await db.promise().execute("DELETE FROM `group` WHERE id = ?", [id]);
};

exports.getGroupMeetingIds = async (groupId) => {
  const [rows] = await db.promise().query(
    "SELECT id FROM meeting WHERE group_id = ?",
    [groupId]
  );
  return rows;
};

exports.getUserByEmail = async (email, groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT u.* FROM user u 
    JOIN group_admin ga ON ga.user_id = u.id
     WHERE u.email = ? AND ga.group_id = ?`,
    [email, groupId]
  );
  return rows[0];
};

exports.getOwner = async (groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT ga.user_id FROM group_admin ga 
     WHERE ga.group_id = ? AND ga.role = 'OWNER'`,
    [groupId]
  );
  return rows;
};

exports.countOwners = async (groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT COUNT(*) as count FROM group_admin WHERE group_id = ? AND role = 'OWNER'`,
    [groupId]
  );
  return rows[0].count;
};

exports.removeGroupAdmin = async (groupId, userId) => {
  const [result] = await db.promise().execute(
    `DELETE FROM group_admin 
     WHERE group_id = ? AND user_id = ?`,
    [groupId, userId]
  );
  return result.affectedRows > 0;
};

exports.removeMeetingAdminByUser = async (groupId, userId) => {
  const [result] = await db.promise().execute(
    `DELETE ma FROM meeting_admin ma
     JOIN meeting m ON m.id = ma.meeting_id
     WHERE m.group_id = ? AND ma.user_id = ?`,
    [groupId, userId]
  );
  return result.affectedRows > 0;
};

exports.countOtherAdmins = async (userId, groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT COUNT(*) as count FROM group_admin 
     WHERE group_id = ? AND user_id <> ? AND role <> 'OWNER'`,
    [groupId, userId]
  );
  return rows[0].count;
};

exports.getUserRole = async (userId) => {
  const [rows] = await db.promise().execute(
    `SELECT role FROM user WHERE id = ?`,
    [userId]
  );
  return rows[0].role;
};

exports.getGroupAsSuperAdmin = async (groupId) => {
  const [rows] = await db.promise().execute(
    `
    SELECT
      g.id AS group_id,
      g.group_name,
      g.description,
      g.group_photo,
      gc.id AS group_content_id,
      'Super_Admin' AS membership_role
    FROM \`group\` g
    LEFT JOIN group_content gc ON gc.group_id = g.id
    WHERE g.id = ?
    LIMIT 1
    `,
    [groupId]
  );

  return rows[0];
};

exports.getGroupWithAccess = async (userId, groupId) => {
  const [rows] = await db.promise().query(
    `
    SELECT
      g.id AS group_id,
      g.group_name,
      g.description,
      g.group_photo,
      gc.id AS group_content_id,
      CASE
        WHEN ga.user_id IS NOT NULL THEN 'Administrator'
        WHEN gm.member_id IS NOT NULL THEN 'Member'
        ELSE NULL
      END AS membership_role
    FROM \`group\` g
    LEFT JOIN group_admin ga
      ON ga.group_id = g.id AND ga.user_id = ?
    LEFT JOIN group_membership gm
      ON gm.group_id = g.id AND gm.member_id = ?
    LEFT JOIN group_content gc ON gc.group_id = g.id
    WHERE g.id = ?
    LIMIT 1
    `,
    [userId, userId, groupId]
  );

  return rows[0];
};

exports.getGroupMedia = async (groupId) => {
  const [rows] = await db.promise().execute(
    `
    SELECT * FROM (
      SELECT
        gcr.id AS media_id,
        NULL AS message_id,
        NULL AS sender_id,
        gcr.file_name,
        gcr.file_name AS original_name,
        gcr.file_type,
        gcr.file_size,
        NULL AS cloud_public_id,
        gcr.file_url AS url,
        gcr.created_at,
        'content' AS source
      FROM group_content_resource gcr
      INNER JOIN group_content gc ON gc.id = gcr.group_content_id
      WHERE gc.group_id = ?
      UNION ALL
      SELECT
        gm.id AS media_id,
        gm.message_id,
        gm.sender_id,
        gm.file_name,
        gm.file_name AS original_name,
        CAST(gm.media_type AS CHAR) AS file_type,
        NULL AS file_size,
        NULL AS cloud_public_id,
        gm.media_url AS url,
        gm.created_at,
        'chat' AS source
      FROM group_message_media gm
      WHERE gm.group_id = ?
    ) AS group_media_all
    ORDER BY created_at ASC
    `,
    [groupId, groupId]
  );

  return rows;
};


exports.getGroupAdmins = async (groupId) => {
  const [rows] = await db.promise().query(
    `
    SELECT
      ga.user_id,
      u.name,
      u.email,
      u.user_photo,
      ga.role,
      ga.assigned_by,
      ga.created_at
    FROM group_admin ga
    JOIN user u ON u.id = ga.user_id
    WHERE ga.group_id = ?
    ORDER BY FIELD(ga.role, 'OWNER', 'ADMIN'), ga.created_at ASC
    `,
    [groupId]
  );

  return rows;
};

exports.getAnyOtherAdmin = async (userId, groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT user_id FROM group_admin 
     WHERE group_id = ? AND user_id <> ? AND role <> 'OWNER' LIMIT 1 `,
    [groupId, userId]
  );
  return rows[0];
};

exports.updateGroupAdmin = async (groupId, userId, role) => {
  await db.promise().execute(
    `UPDATE group_admin 
     SET role = ? 
     WHERE group_id = ? AND user_id = ?`,
    [role, groupId, userId]
  );
};

exports.getGroupRoleByUser = async (userId, groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT role FROM group_admin 
     WHERE group_id = ? AND user_id = ?`,
    [groupId, userId]
  );
  return rows[0].role;
};

exports.getGroupOwner = async (groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT user_id FROM group_admin 
     WHERE group_id = ? AND role = 'OWNER'`,
    [groupId]
  );
  return rows[0];
};

/* ——— leave group (transactional; pass pool connection from service) ——— */

exports.leaveSelectMyAdminRole = async (conn, groupId, userId) => {
  const [rows] = await conn.query(
    "SELECT role FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
    [groupId, userId]
  );
  return rows;
};

exports.leaveCountOtherAdmins = async (conn, groupId, excludeUserId) => {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM group_admin WHERE group_id = ? AND user_id <> ?",
    [groupId, excludeUserId]
  );
  return Number(rows[0]?.c) || 0;
};

exports.leaveListAdministratorCandidates = async (conn, excludeUserId) => {
  const [rows] = await conn.query(
    `SELECT u.id, u.name, u.user_photo
     FROM administrator a
     INNER JOIN user u ON u.id = a.user_id
     WHERE u.id <> ?
       AND u.role = 'Administrator'
     ORDER BY u.name ASC
     LIMIT 50`,
    [excludeUserId]
  );
  return rows;
};

exports.leaveFindAdministratorByUserId = async (conn, userId) => {
  const [rows] = await conn.query(
    `SELECT a.user_id
     FROM administrator a
     INNER JOIN user u ON u.id = a.user_id
     WHERE a.user_id = ? AND u.role = 'Administrator'
     LIMIT 1`,
    [userId]
  );
  return rows;
};

exports.leaveUpsertGroupAdmin = async (
  conn,
  { id, groupId, userId, role, assignedBy }
) => {
  await conn.query(
    `INSERT INTO group_admin (id, group_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [id, groupId, userId, role, assignedBy]
  );
};

exports.leaveSelectMeetingIdsByGroup = async (conn, groupId) => {
  const [rows] = await conn.query(
    "SELECT id FROM meeting WHERE group_id = ?",
    [groupId]
  );
  return rows;
};

exports.leaveUpsertMeetingAdmin = async (
  conn,
  { id, meetingId, userId, role, assignedBy }
) => {
  await conn.query(
    `INSERT INTO meeting_admin (id, meeting_id, user_id, role, assigned_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), assigned_by = VALUES(assigned_by)`,
    [id, meetingId, userId, role, assignedBy]
  );
};

exports.leaveDeleteGroupAdmin = async (conn, groupId, userId) => {
  await conn.query(
    "DELETE FROM group_admin WHERE group_id = ? AND user_id = ?",
    [groupId, userId]
  );
};

exports.leaveDeleteMeetingAdminsForUserInGroup = async (conn, groupId, userId) => {
  await conn.query(
    `DELETE ma FROM meeting_admin ma
     JOIN meeting m ON m.id = ma.meeting_id
     WHERE m.group_id = ? AND ma.user_id = ?`,
    [groupId, userId]
  );
};

exports.leaveDeleteGroupMembership = async (conn, groupId, memberId) => {
  await conn.query(
    "DELETE FROM group_membership WHERE group_id = ? AND member_id = ?",
    [groupId, memberId]
  );
};