const httpError = require("../utils/httpError");

exports.requireAuthenticatedUser = (req) => {
  if (!req.user?.id) {
    throw httpError(401, "Unauthorized: user not found");
  }
};
