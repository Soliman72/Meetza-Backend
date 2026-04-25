const { error: resError } = require("../dto");

module.exports = function sendError(res, err) {
  const status =
    err.status && err.status >= 400 && err.status < 600 ? err.status : 500;

  return res.status(status).json(
    resError(err.message || "Server error", {
      ...(status >= 500 ? { error: err.message } : {}),
    })
  );
};
