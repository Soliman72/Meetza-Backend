function getRequestedLocalization(req) {
  const requestedLocalization = (req.header("X-Localization") || "ar")
    .toString()
    .toLowerCase()
    .trim();

  return ["ar", "en"].includes(requestedLocalization)
    ? requestedLocalization
    : "ar";
}

module.exports = { getRequestedLocalization };