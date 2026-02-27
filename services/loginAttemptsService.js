/**
 * Tracks failed login attempts per email.
 * After 3 failed attempts → reCAPTCHA is required on the next request.
 */

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes, then attempt count resets

/** @type {Map<string, { count: number, firstAttemptAt: number }>} */
const attemptsByEmail = new Map();

function normalizeKey(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Current failed attempt count for this email (within the time window).
 * @param {string} email
 * @returns {{ count: number, firstAttemptAt: number } | null}
 */
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

/**
 * Whether reCAPTCHA is required for this email.
 * @param {string} email
 * @returns {boolean}
 */
function requiresCaptcha(email) {
  const entry = getAttempts(email);
  return entry ? entry.count >= MAX_FAILED_ATTEMPTS : false;
}

/**
 * Increment failed attempt count for this email.
 * @param {string} email
 */
function recordFailedAttempt(email) {
  const key = normalizeKey(email);
  if (!key) return;
  const entry = attemptsByEmail.get(key) || { count: 0, firstAttemptAt: Date.now() };
  entry.count += 1;
  attemptsByEmail.set(key, entry);
}

/**
 * Clear attempt count on successful login.
 * @param {string} email
 */
function clearAttempts(email) {
  const key = normalizeKey(email);
  if (key) attemptsByEmail.delete(key);
}

/**
 * Remaining attempts before captcha is required (for frontend display if needed).
 * @param {string} email
 * @returns {{ remaining: number, requiresCaptcha: boolean }}
 */
function getAttemptsInfo(email) {
  const entry = getAttempts(email);
  if (!entry) {
    return { remaining: MAX_FAILED_ATTEMPTS, requiresCaptcha: false };
  }
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.count);
  return {
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
