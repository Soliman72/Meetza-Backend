/**
 * Validates query params for GET /api/group/pending/email-action
 */
exports.requirePendingGroupEmailToken = (req) => {
  const raw = req.query?.token;
  const token = typeof raw === "string" ? raw.trim() : "";
  if (!token) {
    throw { status: 400, message: "Missing token" };
  }
  return token;
};
