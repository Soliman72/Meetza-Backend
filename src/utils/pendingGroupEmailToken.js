const jwt = require("jsonwebtoken");
require("dotenv").config();

const SCOPE = "pending_group_action";

exports.signPendingGroupAction = ({ pendingGroupId, reviewerId, action }) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(
    { scope: SCOPE, pendingGroupId, reviewerId, action },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.verifyPendingGroupActionToken = (token) => {
  if (!token || typeof token !== "string") {
    const e = new Error("Missing token");
    e.status = 400;
    throw e;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.scope !== SCOPE) {
      const e = new Error("Invalid link");
      e.status = 400;
      throw e;
    }
    if (!["approve", "reject"].includes(payload.action)) {
      const e = new Error("Invalid link");
      e.status = 400;
      throw e;
    }
    if (!payload.pendingGroupId || !payload.reviewerId) {
      const e = new Error("Invalid link");
      e.status = 400;
      throw e;
    }
    return payload;
  } catch (err) {
    if (err.status) throw err;
    const e = new Error("Invalid or expired link");
    e.status = 400;
    throw e;
  }
};
