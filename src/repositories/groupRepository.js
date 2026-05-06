const db = require("../config/db");
const { normalizeToArray, normalizeAndValidate } = require("../utils/normalize");
const pendingGroupRepository = require("./pendingGroupRepository");
const groupAdminRepository = require("./groupAdminRepository");
const meetingRepository = require("./meetingRepository");
const meetingAdminRepository = require("./meetingAdminRepository");
const groupMembershipRepository = require("./group_memberShipRepository");
const userRepository = require("./userRepository");

const toNullable = (value) => (value === undefined ? null : value);

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

// Pending Groups
exports.createPendingGroup = pendingGroupRepository.createPendingGroup;
exports.createPendingGroupAdmin = pendingGroupRepository.createPendingGroupAdmin;
exports.findPendingGroupById = pendingGroupRepository.findPendingGroupById;
exports.getPendingGroups = pendingGroupRepository.getPendingGroups;
exports.getPendingGroupAdmins = pendingGroupRepository.getPendingGroupAdmins;
exports.updatePendingGroupStatus = pendingGroupRepository.updatePendingGroupStatus;
exports.deletePendingGroup = pendingGroupRepository.deletePendingGroup;

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

exports.getAllGroupsForContext = async () => {
  const [rows] = await db.promise().execute(
    "SELECT group_name, description FROM `group`"
  );
  return rows;
};

exports.getGroupById = async (id) => {
  const [rows] = await db.promise().execute("SELECT * FROM `group` WHERE id = ?", [id]);
  return rows[0];
};

// Group Admins
exports.getAdminsByGroupIds = groupAdminRepository.getAdminsByGroupIds;
exports.getOwner = groupAdminRepository.getOwner;
exports.countOwners = groupAdminRepository.countOwners;
exports.removeGroupAdmin = groupAdminRepository.removeGroupAdmin;
exports.countOtherAdmins = groupAdminRepository.countOtherAdmins;
exports.getGroupAdmins = groupAdminRepository.getGroupAdmins;
exports.getAnyOtherAdmin = groupAdminRepository.getAnyOtherAdmin;
exports.updateGroupAdmin = groupAdminRepository.updateGroupAdmin;
exports.getGroupRoleByUser = groupAdminRepository.getGroupRoleByUser;
exports.getGroupOwner = groupAdminRepository.getGroupOwner;

// User logic
exports.getUserRole = userRepository.getUserRole || (async (userId) => {
  const [rows] = await db.promise().execute(`SELECT role FROM user WHERE id = ?`, [userId]);
  return rows[0]?.role;
});
exports.getUserByEmail = async (email, groupId) => {
  const [rows] = await db.promise().execute(
    `SELECT u.*, ga.role AS group_admin_role FROM user u 
     JOIN group_admin ga ON ga.user_id = u.id
     WHERE u.email = ? AND ga.group_id = ?`,
    [email, groupId]
  );
  return rows[0];
};

exports.updateGroup = async (id, updates) => {
  const sql = `UPDATE \`group\` SET 
        group_name = COALESCE(?, group_name), 
        description = COALESCE(?, description),
        group_photo = COALESCE(?, group_photo),
        year = COALESCE(?, year),
        semester = COALESCE(?, semester)
        WHERE id = ?`;

  await db.promise().execute(sql, [
    toNullable(updates.group_name),
    toNullable(updates.description),
    toNullable(updates.group_photo),
    toNullable(updates.year),
    toNullable(updates.semester),
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

exports.removeMeetingAdminByUser = meetingAdminRepository.removeMeetingAdminByUser;

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

// Leave Group Logic
exports.leaveSelectMyAdminRole = groupAdminRepository.leaveSelectMyAdminRole;
exports.leaveCountOtherAdmins = groupAdminRepository.leaveCountOtherAdmins;
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
exports.leaveUpsertGroupAdmin = groupAdminRepository.leaveUpsertGroupAdmin;
exports.leaveSelectMeetingIdsByGroup = async (conn, groupId) => {
  const [rows] = await conn.query(
    "SELECT id FROM meeting WHERE group_id = ?",
    [groupId]
  );
  return rows;
};
exports.leaveUpsertMeetingAdmin = meetingAdminRepository.leaveUpsertMeetingAdmin;
exports.leaveDeleteGroupAdmin = groupAdminRepository.leaveDeleteGroupAdmin;
exports.leaveDeleteMeetingAdminsForUserInGroup = meetingAdminRepository.leaveDeleteMeetingAdminsForUserInGroup;
exports.leaveDeleteGroupMembership = groupMembershipRepository.leaveDeleteGroupMembership;
