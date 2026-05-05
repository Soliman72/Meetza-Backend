const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_WINDOW_MS = 30 * 60 * 1000;

const attemptsByEmail = new Map();

function normalizeKey(email) {
  return String(email || "").trim().toLowerCase();
}

function getAttempts(email) {
  const key = normalizeKey(email);
  if (!key) return null;
  const entry = attemptsByEmail.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (now - entry.firstAttemptAt > LOCKOUT_WINDOW_MS) {
    attemptsByEmail.delete(key);
    return null;
  }
  return entry;
}

function requiresCaptcha(email) {
  const entry = getAttempts(email);
  return entry ? entry.count >= MAX_FAILED_ATTEMPTS : false;
}

function recordFailedAttempt(email) {
  const key = normalizeKey(email);
  if (!key) return;
  const entry = attemptsByEmail.get(key) || { count: 0, firstAttemptAt: Date.now() };
  entry.count += 1;
  attemptsByEmail.set(key, entry);
}

function clearAttempts(email) {
  const key = normalizeKey(email);
  if (key) attemptsByEmail.delete(key);
}

function getAttemptsInfo(email) {
  const entry = getAttempts(email);
  if (!entry) {
    return {
      count: 0,
      remaining: MAX_FAILED_ATTEMPTS,
      requiresCaptcha: false,
    };
  }
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.count);
  return {
    count: entry.count,
    remaining,
    requiresCaptcha: entry.count >= MAX_FAILED_ATTEMPTS,
  };
}

module.exports = {
  MAX_FAILED_ATTEMPTS,
  getAttempts,
  requiresCaptcha,
  recordFailedAttempt,
  clearAttempts,
  getAttemptsInfo,
};
