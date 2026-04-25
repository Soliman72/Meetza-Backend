const db = require("../config/db");

exports.getUserRole = async (userId) => {
  const [userRows] = await db
    .promise()
    .query(`SELECT role FROM user WHERE id = ? LIMIT 1`, [userId]);
  return userRows[0]?.role;
};

exports.getMyGroupsSuperAdmin = async () => {
  const queryStr = `
        SELECT DISTINCT
          g.id,
          g.group_name,
          g.description,
          g.group_photo,
          gc.id AS group_content_id,
          COALESCE(stats.member_count, 0) + 1 AS member_count,
          'Super_Admin' AS membership_role,
          msg.message AS last_message,
          msg.created_at AS last_message_at,
          msg.sender_name AS last_sender_name
        FROM \`group\` g
        LEFT JOIN (
          SELECT
            gm_inner.group_id,
            gm_inner.message,
            gm_inner.created_at,
            u.name AS sender_name
          FROM group_message gm_inner
          JOIN (
            SELECT group_id, MAX(created_at) AS latest_created_at
            FROM group_message
            GROUP BY group_id
          ) latest
            ON gm_inner.group_id = latest.group_id
            AND gm_inner.created_at = latest.latest_created_at
          JOIN user u ON u.id = gm_inner.sender_id
        ) msg ON msg.group_id = g.id
        LEFT JOIN (
          SELECT group_id, COUNT(*) AS member_count
          FROM group_membership
          GROUP BY group_id
        ) stats ON stats.group_id = g.id
        LEFT JOIN group_content gc ON gc.group_id = g.id
        ORDER BY msg.created_at IS NULL, msg.created_at DESC, g.group_name ASC
      `;
  const [rows] = await db.promise().query(queryStr, []);
  return rows;
};

exports.getMyGroupsForUser = async (userId) => {
  const queryStr = `
        SELECT DISTINCT
          g.id,
          g.group_name,
          g.description,
          g.group_photo,
          gc.id AS group_content_id,
          COALESCE(stats.member_count, 0) + 1 AS member_count,
          CASE
            WHEN ga.user_id IS NOT NULL THEN 'Administrator'
            WHEN gm.member_id IS NOT NULL THEN 'Member'
            ELSE NULL
          END AS membership_role,
          msg.message AS last_message,
          msg.created_at AS last_message_at,
          msg.sender_name AS last_sender_name
        FROM \`group\` g
        LEFT JOIN group_admin ga
          ON ga.group_id = g.id AND ga.user_id = ?
        LEFT JOIN group_membership gm
          ON gm.group_id = g.id AND gm.member_id = ?
        LEFT JOIN (
          SELECT
            gm_inner.group_id,
            gm_inner.message,
            gm_inner.created_at,
            u.name AS sender_name
          FROM group_message gm_inner
          JOIN (
            SELECT group_id, MAX(created_at) AS latest_created_at
            FROM group_message
            GROUP BY group_id
          ) latest
            ON gm_inner.group_id = latest.group_id
            AND gm_inner.created_at = latest.latest_created_at
          JOIN user u ON u.id = gm_inner.sender_id
        ) msg ON msg.group_id = g.id
        LEFT JOIN (
          SELECT group_id, COUNT(*) AS member_count
          FROM group_membership
          GROUP BY group_id
        ) stats ON stats.group_id = g.id
        LEFT JOIN group_content gc ON gc.group_id = g.id
        WHERE ga.user_id IS NOT NULL OR gm.member_id IS NOT NULL
        ORDER BY msg.created_at IS NULL, msg.created_at DESC, g.group_name ASC
      `;
  const [rows] = await db.promise().query(queryStr, [userId, userId]);
  return rows;
};

exports.getUnreadGroups = async (userId) => {
  const [rows] = await db.promise().query(
    `
      SELECT DISTINCT
        g.id,
        g.group_name,
        g.description,
        g.group_photo,
        gc.id AS group_content_id,
        COALESCE(stats.member_count, 0) + 1 AS member_count,
        CASE
          WHEN ga.user_id IS NOT NULL THEN 'Administrator'
          WHEN gm.member_id IS NOT NULL THEN 'Member'
          ELSE NULL
        END AS membership_role,
        msg.message AS last_message,
        msg.created_at AS last_message_at,
        msg.sender_name AS last_sender_name,
        unread_stats.unread_count
      FROM \`group\` g
      LEFT JOIN group_admin ga
        ON ga.group_id = g.id AND ga.user_id = ?
      LEFT JOIN group_membership gm
        ON gm.group_id = g.id AND gm.member_id = ?
      LEFT JOIN (
        SELECT
          gm_inner.group_id,
          gm_inner.message,
          gm_inner.created_at,
          u.name AS sender_name
        FROM group_message gm_inner
        JOIN (
          SELECT group_id, MAX(created_at) AS latest_created_at
          FROM group_message
          GROUP BY group_id
        ) latest
          ON gm_inner.group_id = latest.group_id
          AND gm_inner.created_at = latest.latest_created_at
        JOIN user u ON u.id = gm_inner.sender_id
      ) msg ON msg.group_id = g.id
      LEFT JOIN (
        SELECT group_id, COUNT(*) AS member_count
        FROM group_membership
        GROUP BY group_id
      ) stats ON stats.group_id = g.id

      LEFT JOIN (
        SELECT
          gm.group_id,
          COUNT(*) AS unread_count
        FROM group_message gm
        JOIN message_read_status gmrs
          ON gm.id = gmrs.message_id
        WHERE gmrs.user_id = ?
          AND gmrs.read_at IS NULL
        GROUP BY gm.group_id
      ) unread_stats ON unread_stats.group_id = g.id
      LEFT JOIN group_content gc ON gc.group_id = g.id
      WHERE unread_stats.unread_count > 0
        AND (ga.user_id IS NOT NULL OR gm.member_id IS NOT NULL)

      ORDER BY msg.created_at IS NULL, msg.created_at DESC, g.group_name ASC
      `,
    [userId, userId, userId]
  );
  return rows;
};

exports.deleteGroupMessageAsAdmin = async (messageId, groupId) => {
  const [result] = await db
    .promise()
    .query("DELETE FROM group_message WHERE id = ? AND group_id = ?", [
      messageId,
      groupId,
    ]);
  return result.affectedRows;
};

exports.deleteGroupMessageAsSender = async (messageId, groupId, userId) => {
  const [result] = await db
    .promise()
    .query(
      "DELETE FROM group_message WHERE id = ? AND group_id = ? AND sender_id = ?",
      [messageId, groupId, userId]
    );
  return result.affectedRows;
};

exports.updateGroupMessageText = async (
  message,
  messageId,
  userId,
  groupId
) => {
  const [result] = await db.promise().query(
    "UPDATE group_message SET message = ? WHERE id = ? AND sender_id = ? AND group_id = ?",
    [message, messageId, userId, groupId]
  );
  return result.affectedRows;
};

exports.getMessageById = async (messageId) => {
  const [messageRows] = await db
    .promise()
    .query("SELECT * FROM group_message WHERE id = ?", [messageId]);
  return messageRows[0] || null;
};

exports.getGroupMembersForInfo = async (
  administratorId,
  groupId
) => {
  const [memberRows] = await db.promise().query(
    `
        SELECT
          u.id,
          u.name,
          u.email,
          u.user_photo,
          CASE WHEN ga_role.user_id IS NOT NULL THEN 'Administrator'
               WHEN u.id = ? THEN 'Administrator'
               ELSE 'Member' END AS role
        FROM (
          SELECT member_id AS user_id FROM group_membership WHERE group_id = ?
          UNION
          SELECT user_id FROM group_admin WHERE group_id = ?
          UNION
          SELECT ? AS user_id
        ) participant
        JOIN user u ON u.id = participant.user_id
        LEFT JOIN group_admin ga_role ON ga_role.group_id = ? AND ga_role.user_id = u.id
        ORDER BY role DESC, u.name ASC
      `,
    [administratorId, groupId, groupId, administratorId, groupId]
  );
  return memberRows;
};

exports.getFirstGroupContentRow = async (groupId) => {
  const [contentRows] = await db
    .promise()
    .query(
      "SELECT id, content_name, content_description FROM group_content WHERE group_id = ?",
      [groupId]
    );
  return contentRows[0] || null;
};

exports.getGroupContentResources = async (groupContentId) => {
  const [resources] = await db.promise().query(
    `
              SELECT
                id,
                file_url,
                file_name,
                file_type,
                file_size,
                created_at
              FROM group_content_resource
              WHERE group_content_id = ?
              ORDER BY created_at DESC
            `,
    [groupContentId]
  );
  return resources;
};

exports.getMeetingsForGroup = async (groupId, fromDate = null, toDate = null) => {
  let sql = `
          SELECT
            id,
            title,
            start_time,
            end_time,
            status
          FROM meeting
          WHERE group_id = ?
        `;
  const params = [groupId];

  if (fromDate) {
    sql += " AND start_time >= ?";
    params.push(fromDate);
  }
  if (toDate) {
    sql += " AND start_time <= ?";
    params.push(toDate);
  }

  sql += " ORDER BY start_time ASC";

  const [meetings] = await db.promise().query(sql, params);
  return meetings;
};

exports.getUserName = async (userId) => {
  const [userRows] = await db
    .promise()
    .query("SELECT name FROM user WHERE id = ?", [userId]);
  return userRows[0]?.name || "User";
};

exports.getUserForReaction = async (userId) => {
  const [userRows] = await db
    .promise()
    .query("SELECT id, name, user_photo, email FROM user WHERE id = ?", [userId]);
  return userRows[0] || null;
};

exports.findChatMediaByUserId = async (userId, userRole) => {
  const params = [];
  let accessClause = "";

  if (userRole !== "Super_Admin") {
    accessClause = `
      WHERE (
        EXISTS (
          SELECT 1
          FROM group_admin ga
          WHERE ga.group_id = gmm.group_id
            AND ga.user_id = ?
        )
        OR EXISTS (
          SELECT 1
          FROM group_membership gms
          WHERE gms.group_id = gmm.group_id
            AND gms.member_id = ?
        )
      )`;
    params.push(userId, userId);
  }

  const [rows] = await db.promise().execute(
    `SELECT
        gmm.id,
        gmm.file_name,
        gmm.media_url,
        gmm.media_type,
        gmm.created_at,
        gmm.sender_id,
        sender.name AS sender_name,
        sender.user_photo AS sender_photo,
        gmm.group_id,
        g.group_name,
        gmm.message_id,
        gm.message
      FROM group_message_media gmm
      INNER JOIN group_message gm ON gm.id = gmm.message_id
      INNER JOIN \`group\` g ON g.id = gmm.group_id
      INNER JOIN user sender ON sender.id = gmm.sender_id
      ${accessClause}
      ORDER BY gmm.created_at DESC`,
    params
  );

  return rows;
};
