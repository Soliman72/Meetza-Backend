const { GroupAccessError } = require("../utils/groupAccess");

function respondGroupAccessOrServerError(res, err) {
  if (err instanceof GroupAccessError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }
  return res
    .status(500)
    .json({ success: false, message: err.message || "Unexpected error" });
}

module.exports = {
  respondGroupAccessOrServerError,
};
