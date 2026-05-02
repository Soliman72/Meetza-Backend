function normalizeTopics(value) {
  if (value == null) return null;

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value;
    } catch {
      return value;
    }
  }

  return value;
}

module.exports = { normalizeTopics };