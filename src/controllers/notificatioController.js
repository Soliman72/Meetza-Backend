const service = require("../services/notificatioService");
const notificationValidator = require("../validators/notificationValidator");

const sendError = (res, err) => {
  const status =
    err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const body = { success: false, message: err.message };
  if (status >= 500) body.error = err.message;
  return res.status(status).json(body);
};

exports.getMemberNotifications = async (req, res) => {
  try {
    const data = await service.getMemberNotifications(req.user.id);
    return res.json({ success: true, notifications: data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await service.getUnreadCount(req.user.id);
    return res.json({ success: true, unreadCount: count });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    notificationValidator.validateNotificationIdParam(req.params.id);
    const ok = await service.markAsRead(req.params.id, req.user.id);

    if (!ok) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await service.markAllAsRead(req.user.id);
    return res.json({ success: true });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    notificationValidator.validateNotificationIdParam(req.params.id);
    const ok = await service.deleteNotification(req.params.id, req.user.id);

    if (!ok) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    return sendError(res, err);
  }
};
