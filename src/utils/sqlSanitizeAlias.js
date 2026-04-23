function sanitizeAlias(alias, allowed = ["v"]) {
  if (!alias || typeof alias !== "string") return allowed[0];
  return allowed.includes(alias) ? alias : allowed[0];
}

module.exports = { sanitizeAlias };