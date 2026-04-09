const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const validator = require("validator");

const {
  saveMessage,
  getMessages,
  markMessageAsRead,
  markMessageAsUnread,
  markMessagesAsRead,
  getReadMessages,
  getUnreadMessages,
  getUnreadCount,
} = require("../services/chatMessageService");
const { ensureGroupAccess, GroupAccessError } = require("../utils/groupAccess");
const {
  upload,
  uploadToCloudinary,
  uploadToCloudinaryResources,
} = require("../utils/uploadFile");

let ioInstance = null;

const registerChatIo = (io) => {
  ioInstance = io;
};

const broadcastMessage = (message) => {
  if (!ioInstance || !message) return;
  ioInstance.to(`group:${message.group_id}`).emit("message", message);
};

const handleError = (res, err) => {
  if (err instanceof GroupAccessError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: err.message || "Unexpected error" });
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

    // Fetch the user role (check if Super_Admin)
    const [userRows] = await db
      .promise()
      .query(`SELECT role FROM user WHERE id = ? LIMIT 1`, [userId]);
    const userRole = userRows[0]?.role;

    let queryStr;
    let queryParams;

    if (userRole === "Super_Admin") {
      // Show ALL groups if Super_Admin
      queryStr = `
        SELECT DISTINCT
          g.id,
          g.group_name,
          g.description,
          g.group_photo,
          g.position_id,
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
      queryParams = [];
    } else {
      // Show only my groups if not Super_Admin
      queryStr = `
        SELECT DISTINCT
          g.id,
          g.group_name,
          g.description,
          g.group_photo,
          g.position_id,
          gc.id AS group_content_id,
          COALESCE(stats.member_count, 0) + 1 AS member_count,
          CASE
            WHEN ga.user_id IS NOT NULL THEN 'Administrator'
            WHEN g.administrator_id = ? THEN 'Administrator'
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
        WHERE ga.user_id IS NOT NULL OR g.administrator_id = ? OR gm.member_id IS NOT NULL
        ORDER BY msg.created_at IS NULL, msg.created_at DESC, g.group_name ASC
      `;

      queryParams = [userId, userId, userId, userId];
    }

    const [rows] = await db.promise().query(queryStr, queryParams);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Get unread groups (FIXED VERSION)
exports.getUnreadGroups = async (req, res) => {
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
        g.position_id,
        gc.id AS group_content_id,
        COALESCE(stats.member_count, 0) + 1 AS member_count,
        CASE
          WHEN ga.user_id IS NOT NULL THEN 'Administrator'
          WHEN g.administrator_id = ? THEN 'Administrator'
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
        AND (ga.user_id IS NOT NULL OR g.administrator_id = ? OR gm.member_id IS NOT NULL)

      ORDER BY msg.created_at IS NULL, msg.created_at DESC, g.group_name ASC
      `,
      [userId, userId, userId, userId, userId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    const { limit, before } = req.query;
    const { searchMessage } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId is required",
      });
    }

    // get messages with search is not supported yet
    // why?
    // because it requires full text search implementation which is not yet done

    if (searchMessage) {
      return res.status(400).json({
        success: false,
        message: "searchMessage parameter is not supported",
      });
    }

    await ensureGroupAccess(userId, groupId);
    const messages = await getMessages(groupId, { limit, before, userId });

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Send message with optional media (images, files, voice/audio)
exports.sendMessage = (req, res) => {
  // Apply multer upload middleware to handle file uploads
  upload.fields([
    { name: "media", maxCount: 10 }, // Allow multiple media files
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }

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

      // At least message text or media file should be provided
      const messageText = (message || "").trim();
      const hasMedia = req.files?.media && req.files.media.length > 0;

      if (!messageText && !hasMedia) {
        return res.status(400).json({
          success: false,
          message: "Either message text or media file is required",
        });
      }

      await ensureGroupAccess(userId, groupId);

      // Handle media uploads first if any
      const uploadedMedia = [];


      // if text is link then check if it is valid url and push it to uploadedMedia
      if (validator.isURL(messageText, {
        require_protocol: true,
        protocols: ["http", "https"],
      })) {
        // if it is valid url then push it to uploadedMedia
        uploadedMedia.push({
          id: uuidv4(),
          group_id: groupId,
          sender_id: userId,
          mediaUrl: messageText,
          mediaType: "link",
          fileName: messageText,
        });
      }
      // if there is media then upload it
      if (hasMedia) {
        for (const file of req.files.media) {
          let mediaUrl;
          let mediaType = "file";
          let resourceType = "auto";
          let fileName = file.originalname;

          const mimeType = file.mimetype || "";

          // Determine media type based on MIME type
          if (mimeType.startsWith("image/")) {
            mediaType = "image";
            resourceType = "auto";
          } else if (
            mimeType.startsWith("audio/") ||
            mimeType.includes("voice") ||
            mimeType.includes("mpeg") ||
            mimeType.includes("wav") ||
            mimeType.includes("ogg")
          ) {
            mediaType = "voice";
            resourceType = "auto";
          } else if (mimeType.startsWith("video/")) {
            mediaType = "video";
            resourceType = "auto";
          } else {
            // Documents, PDFs, etc.
            mediaType = "file";
            resourceType = "raw";
          }

          // Upload to Cloudinary
          if (mediaType === "file") {
            mediaUrl = await uploadToCloudinaryResources(
              file,
              "group_message_media",
              resourceType
            );
          } else {
            mediaUrl = await uploadToCloudinaryResources(
              file,
              "group_message_media",
              resourceType
            );
          }

          if (mediaUrl) {
            uploadedMedia.push({
              id: uuidv4(),
              group_id: groupId,
              sender_id: userId,
              mediaUrl,
              mediaType,
              fileName,
            });
          }
        }
      }
      // Save the message with media (can be empty if only media is sent)
      const savedMessage = await saveMessage(
        groupId,
        userId,
        messageText || "",
        uploadedMedia
      );

      // Broadcast the message with media
      broadcastMessage(savedMessage);

      return res.status(201).json({
        success: true,
        data: savedMessage,
      });
    } catch (error) {
      return handleError(res, error);
    }
  });
};

// Delete message (also deletes associated media)
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId, messageId } = req.params;
    if (!groupId || !messageId) {
      return res.status(400).json({
        success: false,
        message: "groupId and messageId are required",
      });
    }

    await ensureGroupAccess(userId, groupId);

    if (req.user.role === "Administrator") {
      const [messageRows] = await db
        .promise()
        .query(
          "SELECT id, message FROM group_message WHERE id = ? AND group_id = ?",
          [messageId, groupId]
        );
      if (messageRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Message not found or you are not the sender",
        });
      }
    } else if (req.user.role === "Member") {
      const [messageRows] = await db
        .promise()
        .query(
          "SELECT id, message FROM group_message WHERE id = ? AND sender_id = ? AND group_id = ?",
          [messageId, userId, groupId]
        );
      if (messageRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Message not found or you are not the sender",
        });
      }
    }

    // Delete the message (media is stored in the same row, so it will be deleted automatically)
    // check member of admin
    let whereClause = "";
    const params = [];
    if (req.user.role === "Administrator") {
      whereClause = "WHERE id = ? AND group_id = ?";
      params.push(messageId, groupId);
    } else if (req.user.role === "Member") {
      whereClause = "WHERE id = ? AND sender_id = ? AND group_id = ?";
      params.push(messageId, userId, groupId);
    }
    const [result] = await db
      .promise()
      .query(`DELETE FROM group_message ${whereClause}`, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you are not the sender",
      });
    }

    return res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// update message
exports.updateMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId, messageId } = req.params;
    const { message } = req.body;
    if (!groupId || !messageId) {
      return res.status(400).json({
        success: false,
        message: "groupId and messageId are required",
      });
    }
    await ensureGroupAccess(userId, groupId);

    // Update only if the user is the sender of the message
    const [result] = await db
      .promise()
      .query(
        "UPDATE group_message SET message = ? WHERE id = ? AND sender_id = ? AND group_id = ?",
        [message, messageId, userId, groupId]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you are not the sender",
      });
    }
    const [messageRows] = await db
      .promise()
      .query("SELECT * FROM group_message WHERE id = ?", [messageId]);

    return res.json({
      success: true,
      data: messageRows[0],
      message: "Message updated successfully",
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
      [group.administrator_id, groupId, groupId, group.administrator_id, groupId]
    );

    let content = null;
    if (groupId) {
      const [contentRows] = await db
        .promise()
        .query(
          "SELECT id, content_name, content_description FROM group_content WHERE group_id = ?",
          [groupId]
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
          [contentRows[0].id]
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
      whereClause += " AND start_time >= ?";
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
      whereClause += " AND start_time <= ?";
      params.push(toDate);
    }

    const [meetings] = await db.promise().query(
      `
          SELECT
            id,
            title,
            start_time,
            end_time,
            status
          FROM meeting
          ${whereClause}
          ORDER BY start_time ASC
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

// Mark message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId, messageId } = req.params;

    if (!groupId || !messageId) {
      return res.status(400).json({
        success: false,
        message: "groupId and messageId are required",
      });
    }

    await ensureGroupAccess(userId, groupId);
    await markMessageAsRead(messageId, userId);

    // Emit socket event to notify others in the group
    if (ioInstance) {
      const [userRows] = await db
        .promise()
        .query("SELECT name FROM user WHERE id = ?", [userId]);
      const userName = userRows[0]?.name || "User";

      ioInstance.to(`group:${groupId}`).emit("messageRead", {
        messageId,
        userId,
        userName,
        readAt: new Date(),
      });
    }

    return res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Mark message as unread
exports.markMessageAsUnread = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId, messageId } = req.params;

    if (!groupId || !messageId) {
      return res.status(400).json({
        success: false,
        message: "groupId and messageId are required",
      });
    }

    await ensureGroupAccess(userId, groupId);
    await markMessageAsUnread(messageId, userId);

    // Emit socket event to notify others in the group
    if (ioInstance) {
      const [userRows] = await db
        .promise()
        .query("SELECT name FROM user WHERE id = ?", [userId]);
      const userName = userRows[0]?.name || "User";

      ioInstance.to(`group:${groupId}`).emit("messageUnread", {
        messageId,
        userId,
        userName,
      });
    }

    return res.json({
      success: true,
      message: "Message marked as unread",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Mark all messages in a group as read
exports.markAllMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId is required",
      });
    }

    await ensureGroupAccess(userId, groupId);

    // Get all unread message IDs in the group
    const unreadMessages = await getUnreadMessages(groupId, userId, {
      limit: 1000,
    });
    const messageIds = unreadMessages.map((msg) => msg.id);

    if (messageIds.length > 0) {
      await markMessagesAsRead(messageIds, userId);
    }

    // Emit socket event to notify others in the group
    if (ioInstance) {
      const [userRows] = await db
        .promise()
        .query("SELECT name FROM user WHERE id = ?", [userId]);
      const userName = userRows[0]?.name || "User";

      ioInstance.to(`group:${groupId}`).emit("allMessagesRead", {
        userId,
        userName,
        messageCount: messageIds.length,
        readAt: new Date(),
      });
    }

    return res.json({
      success: true,
      message: `${messageIds.length} messages marked as read`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Get read messages for a user in a group
exports.getReadMessages = async (req, res) => {
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
    const messages = await getReadMessages(groupId, userId, { limit, before });

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Get unread messages for a user in a group
exports.getUnreadMessages = async (req, res) => {
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
    const messages = await getUnreadMessages(groupId, userId, {
      limit,
      before,
    });

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Get unread count for a user in a group
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId is required",
      });
    }

    await ensureGroupAccess(userId, groupId);
    const count = await getUnreadCount(groupId, userId);

    return res.json({
      success: true,
      data: { unread_count: count },
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
