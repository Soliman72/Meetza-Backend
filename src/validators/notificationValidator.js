exports.createNotificationValidator = async (notification) => {
  const { memberId, senderId, title, message } = notification || {};
  if (!memberId || !senderId || !title || !message) {
    throw new Error("Missing fields");
  }
};

exports.validateNotificationIdParam = (id) => {
  if (!id || String(id).trim() === "") {
    const e = new Error("Notification id is required");
    e.status = 400;
    throw e;
  }
};