exports.validateChatRequest = (req) => {
  const message = req.body?.message;
  if (message === undefined || message === null || String(message).trim() === "") {
    const e = new Error("message is required");
    e.status = 400;
    throw e;
  }
};
