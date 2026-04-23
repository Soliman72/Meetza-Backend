const chatService = require("../services/chatService");
const { registerChatIo } = require("../services/chatSocketService");
const { respondGroupAccessOrServerError } = require("../services/groupAccessHttpService");

exports.registerChatIo = registerChatIo;

exports.getMyGroups = async (req, res) => {
  try {
    const data = await chatService.getMyGroups(req);
    return res.json({ success: true, data });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.getUnreadGroups = async (req, res) => {
  try {
    const data = await chatService.getUnreadGroups(req);
    return res.json({ success: true, data });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const data = await chatService.getGroupMessages(req);
    return res.json({ success: true, data });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.sendMessage = (req, res) => {
  chatService.getUploadMiddlewareForSendMessage()(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }
    try {
      const savedMessage = await chatService.processSendMessageAfterUpload(req);
      return res.status(201).json({
        success: true,
        data: savedMessage,
      });
    } catch (error) {
      return respondGroupAccessOrServerError(res, error);
    }
  });
};

exports.deleteMessage = async (req, res) => {
  try {
    await chatService.deleteMessage(req);
    return res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const row = await chatService.updateMessage(req);
    return res.json({
      success: true,
      data: row,
      message: "Message updated successfully",
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.getGroupInfo = async (req, res) => {
  try {
    const payload = await chatService.getGroupInfo(req);
    return res.json({ success: true, data: payload });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.getGroupMeetings = async (req, res) => {
  try {
    const meetings = await chatService.getGroupMeetings(req);
    return res.json({
      success: true,
      data: meetings,
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.markMessageAsRead = async (req, res) => {
  try {
    await chatService.markMessageAsRead(req);
    return res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.markMessageAsUnread = async (req, res) => {
  try {
    await chatService.markMessageAsUnread(req);
    return res.json({
      success: true,
      message: "Message marked as unread",
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.markAllMessagesAsRead = async (req, res) => {
  try {
    const n = await chatService.markAllMessagesAsRead(req);
    return res.json({
      success: true,
      message: `${n} messages marked as read`,
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.getReadMessages = async (req, res) => {
  try {
    const messages = await chatService.getReadMessages(req);
    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.getUnreadMessages = async (req, res) => {
  try {
    const messages = await chatService.getUnreadMessages(req);
    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await chatService.getUnreadCount(req);
    return res.json({
      success: true,
      data: { unread_count: count },
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const data = await chatService.toggleReaction(req);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return respondGroupAccessOrServerError(res, error);
  }
};
