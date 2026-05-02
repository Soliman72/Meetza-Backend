const normalizeLimit = (limit, fallback = 50, max = 200) => {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
};

const normalizeBefore = (before) => {
  if (!before) return undefined;
  const d = new Date(before);
  if (Number.isNaN(d.getTime())) {
    const e = new Error("Invalid 'before' timestamp");
    e.status = 400;
    throw e;
  }
  return d;
};

const normalizeMessage = (message, { allowEmpty = false } = {}) => {
  const text = String(message || "").trim();
  if (!text) {
    if (allowEmpty) return "";
    const e = new Error("Message is required");
    e.status = 400;
    throw e;
  }
  return text;
};

const normalizeEmoji = (emoji) => {
  const val = String(emoji || "").trim();
  if (!val) {
    const e = new Error("Emoji is required");
    e.status = 400;
    throw e;
  }
  return val;
};

module.exports = {
  normalizeLimit,
  normalizeBefore,
  normalizeMessage,
  normalizeEmoji,
};
