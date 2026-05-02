function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/**
 * Allowed DATE_FORMAT patterns for trend queries (avoid SQL injection).
 */
exports.resolveTrendDateFormat = (isAllTime, diffDays) => {
  const groupBy = isAllTime || diffDays > 90 ? "month" : "day";
  const mysqlDateFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";
  return { groupBy, mysqlDateFormat };
};

exports.assertStartBeforeEnd = (start, end) => {
  if (start > end) {
    throw httpError(
      400,
      "startDate must be before or equal to endDate"
    );
  }
};
