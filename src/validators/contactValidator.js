exports.validateCreateContact = (body) => {
  const { message } = body || {};
  if (message == null || String(message).trim() === "") {
    throw { status: 400, message: "message is required" };
  }
};
