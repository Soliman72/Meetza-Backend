exports.requireUserId = (userId) => {
  if (!userId) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
};

exports.requireGroupId = (groupId) => {
  if (!groupId) {
    const err = new Error("groupId is required");
    err.status = 400;
    throw err;
  }
};

exports.requireGroupAndMessageIds = (groupId, messageId) => {
  if (!groupId || !messageId) {
    const err = new Error("groupId and messageId are required");
    err.status = 400;
    throw err;
  }
};

exports.validateSearchMessage = (searchMessage) => {
  if (searchMessage === undefined) return null;
  const trimmed = (searchMessage || "").trim();
  if (!trimmed) {
    const err = new Error("searchMessage cannot be empty");
    err.status = 400;
    throw err;
  }
  if (trimmed.length > 200) {
    const err = new Error("searchMessage must be 200 characters or less");
    err.status = 400;
    throw err;
  }
  return trimmed;
};

exports.validateEmoji = (emoji) => {
  if (!emoji || typeof emoji !== "string" || emoji.trim().length === 0) {
    const err = new Error("emoji is required");
    err.status = 400;
    throw err;
  }
  return emoji.trim().slice(0, 20);
};

exports.validateMeetingDate = (label, value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err = new Error(`Invalid '${label}' date`);
    err.status = 400;
    throw err;
  }
  return d;
};
