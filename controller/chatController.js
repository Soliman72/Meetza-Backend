const db = require("../config/db");
const { saveMessage, getMessages } = require("../services/chatMessageService");
const { ensureGroupAccess, GroupAccessError } = require("../utils/groupAccess");

let ioInstance = null;

const registerChatIo = (io) => {
  ioInstance = io;
};

const broadcastMessage = (message) => {
  if (!ioInstance || !message) return;
  ioInstance.to(`group:${message.group_id}`).emit("message", message);
};

const handleError = (res, error) => {
  if (error instanceof GroupAccessError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Unexpected error",
  });
};

exports.registerChatIo = registerChatIo;

exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [rows] = await db.promise().query(
      `
        SELECT DISTINCT
          g.id,
          g.group_name,
          g.description,
          g.group_photo,
          g.group_content_id,
          g.position_id,
          COALESCE(stats.member_count, 0) + 1 AS member_count,
          CASE
            WHEN g.administrator_id = ? THEN 'Administrator'
            WHEN gm.member_id IS NOT NULL THEN 'Member'
            ELSE NULL
          END AS membership_role,
          msg.message AS last_message,
          msg.created_at AS last_message_at,
          msg.sender_name AS last_sender_name
        FROM \`group\` g
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
        WHERE g.administrator_id = ? OR gm.member_id IS NOT NULL
        ORDER BY msg.created_at IS NULL, msg.created_at DESC, g.group_name ASC
      `,
      [userId, userId, userId]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    const { limit, before } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId is required",
      });
    }

    await ensureGroupAccess(userId, groupId);
    const messages = await getMessages(groupId, { limit, before });

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    const { message } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId is required",
      });
    }

    await ensureGroupAccess(userId, groupId);
    const savedMessage = await saveMessage(groupId, userId, message);
    broadcastMessage(savedMessage);

    return res.status(201).json({
      success: true,
      data: savedMessage,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getGroupInfo = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId is required",
      });
    }

    const group = await ensureGroupAccess(userId, groupId);

    const [memberRows] = await db.promise().query(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.user_photo,
          CASE WHEN u.id = ? THEN 'Administrator' ELSE 'Member' END AS role
        FROM (
          SELECT member_id AS user_id FROM group_membership WHERE group_id = ?
          UNION
          SELECT ? AS user_id
        ) participant
        JOIN user u ON u.id = participant.user_id
        ORDER BY role DESC, u.name ASC
      `,
      [group.administrator_id, groupId, group.administrator_id]
    );

    let content = null;
    if (group.group_content_id) {
      const [contentRows] = await db
        .promise()
        .query(
          "SELECT id, content_name, content_description FROM group_content WHERE id = ?",
          [group.group_content_id]
        );
      if (contentRows.length) {
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
          [group.group_content_id]
        );

        content = {
          ...contentRows[0],
          resources: resources.map((resource) => ({
            ...resource,
            category: determineResourceCategory(resource.file_type),
          })),
        };
      }
    }

    return res.json({
      success: true,
      data: {
        group,
        members: memberRows,
        content,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getGroupMeetings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    const { from, to } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId is required",
      });
    }

    await ensureGroupAccess(userId, groupId);

    const params = [groupId];
    let whereClause = "WHERE group_id = ?";

    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid 'from' date",
        });
      }
      whereClause += " AND datetime >= ?";
      params.push(fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid 'to' date",
        });
      }
      whereClause += " AND datetime <= ?";
      params.push(toDate);
    }

    const [meetings] = await db.promise().query(
      `
          SELECT
            id,
            title,
            datetime,
            status
          FROM meeting
          ${whereClause}
          ORDER BY datetime ASC
        `,
      params
    );

    return res.json({
      success: true,
      data: meetings,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const determineResourceCategory = (fileType = "") => {
  if (!fileType) return "other";
  if (fileType.startsWith("image/")) return "photos";
  if (fileType.startsWith("video/")) return "videos";
  if (fileType.includes("pdf") || fileType.includes("document"))
    return "documents";
  if (fileType.includes("presentation") || fileType.includes("ms-powerpoint"))
    return "documents";
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return "documents";
  if (fileType.includes("audio/")) return "audio";
  if (fileType.includes("link")) return "links";
  return "other";
};
