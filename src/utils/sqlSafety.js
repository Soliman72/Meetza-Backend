function assertSafeSqlFragment(fragment, label = "SQL fragment") {
  if (!fragment) return;
  const s = String(fragment);
  if (/[;]|--|\/\*|\*\//.test(s)) {
    throw new Error(`Unsafe ${label}`);
  }
}

function resolveSafeDateFormat(mysqlDateFormat) {
  if (mysqlDateFormat === "%Y-%m-%d") return "%Y-%m-%d";
  if (mysqlDateFormat === "%Y-%m") return "%Y-%m";
  throw new Error("Invalid mysqlDateFormat");
}

module.exports = {
  assertSafeSqlFragment,
  resolveSafeDateFormat,
};
