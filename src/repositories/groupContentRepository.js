const db = require("../config/db");

exports.findGroupById = async (groupId) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM `group` WHERE id = ?",
    [groupId]
  );
  return rows[0];
};

exports.findContentById = async (id) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM group_content WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

/** First group_content row for a group (e.g. default content when attaching meeting files). */
exports.findFirstContentByGroupId = async (groupId) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM group_content WHERE group_id = ? ORDER BY id ASC LIMIT 1",
    [groupId]
  );
  return rows[0] || null;
};

exports.createContent = async ({ id, content_name, content_description, group_id }) => {
  const sql = `
    INSERT INTO group_content (id, content_name, content_description, group_id) VALUES (?, ?, ?, ?)`;
  await db.promise().execute(sql, [
    id,
    content_name,
    content_description,
    group_id,
  ]);
};

exports.getAllContents = async (query, params) => {
  const [rows] = await db.promise().query(query, params);
  return rows;
};

exports.getResourcesByContentIds = async (ids) => {
  if (!ids || !ids.length) return [];
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await db.promise().query(
    `SELECT id, group_content_id, file_url, file_name, file_type, file_size, created_at FROM group_content_resource WHERE group_content_id IN (${placeholders}) ORDER BY created_at ASC`,
    ids
  );
  return rows;
};

exports.getResourcesByContentId = async (contentId) => {
  const [rows] = await db.promise().query(
    `SELECT id, file_url, file_name, file_type, file_size, created_at FROM group_content_resource WHERE group_content_id = ? ORDER BY created_at ASC`,
    [contentId]
  );
  return rows;
};

exports.hasUserAccessToGroupContent = async (groupId, userId) => {
  const [rows] = await db.promise().query(
    `
        SELECT 1 FROM (
          SELECT user_id FROM group_admin WHERE group_id = ? AND user_id = ?
          UNION
          SELECT member_id AS user_id FROM group_membership WHERE group_id = ? AND member_id = ?
        ) AS access LIMIT 1
        `,
    [groupId, userId, groupId, userId]
  );
  return rows.length > 0;
};

exports.isUserGroupAdmin = async (groupId, userId) => {
  const [rows] = await db.promise().query(
    "SELECT 1 FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
    [groupId, userId]
  );
  return rows.length > 0;
};

exports.updateContentFields = async (id, content_name, content_description) => {
  const [result] = await db.promise().query(
    "UPDATE group_content SET content_name = COALESCE(?, content_name), content_description = COALESCE(?, content_description) WHERE id = ?",
    [content_name, content_description, id]
  );
  return result.affectedRows;
};

exports.findMeetingById = async (meetingId) => {
  const [rows] = await db.promise().query("SELECT * FROM meeting WHERE id = ?", [
    meetingId,
  ]);
  return rows[0] || null;
};

exports.insertResource = async ({
  id,
  group_content_id,
  file_url,
  file_name,
  file_type,
  file_size,
  meeting_id,
}) => {
  await db.promise().query(
    "INSERT INTO group_content_resource (id, group_content_id, file_url, file_name, file_type, file_size, meeting_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      group_content_id,
      file_url,
      file_name,
      file_type,
      file_size,
      meeting_id ?? null,
    ]
  );
};

exports.deleteResource = async (resourceId, groupContentId) => {
  const [result] = await db.promise().query(
    "DELETE FROM group_content_resource WHERE id = ? AND group_content_id = ?",
    [resourceId, groupContentId]
  );
  return result.affectedRows;
};

exports.getMemberIdsByGroupId = async (groupId) => {
  const [rows] = await db.promise().query(
    "SELECT member_id FROM group_membership WHERE group_id = ?",
    [groupId]
  );
  return rows.map((r) => r.member_id);
};

exports.getGroupNameAndOwnerAdmin = async (groupId) => {
  const [rows] = await db.promise().query(
    "SELECT g.group_name, ga.user_id AS administrator_id FROM `group` g JOIN group_admin ga ON ga.group_id = g.id AND ga.role = 'OWNER' WHERE g.id = ?",
    [groupId]
  );
  return rows[0] || null;
};

exports.getResourcesByMeetingId = async (meetingId) => {
  const [rows] = await db.promise().query(
    "SELECT * FROM group_content_resource WHERE meeting_id = ?",
    [meetingId]
  );
  return rows;
};
