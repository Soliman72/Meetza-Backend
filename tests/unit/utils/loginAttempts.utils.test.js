const {
  recordFailedAttempt,
  requiresCaptcha,
  clearAttempts,
  getAttemptsInfo,
  MAX_FAILED_ATTEMPTS,
} = require("../../../src/utils/loginAttempts");

describe("loginAttempts", () => {
  afterEach(() => {
    clearAttempts("test@example.com");
  });

  test("requiresCaptcha returns false for fresh email", () => {
    expect(requiresCaptcha("fresh@example.com")).toBe(false);
  });

  test("requiresCaptcha returns true after MAX_FAILED_ATTEMPTS", () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      recordFailedAttempt("test@example.com");
    }
    expect(requiresCaptcha("test@example.com")).toBe(true);
  });

  test("requiresCaptcha returns false before reaching threshold", () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) {
      recordFailedAttempt("test@example.com");
    }
    expect(requiresCaptcha("test@example.com")).toBe(false);
  });

  test("clearAttempts resets the counter", () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      recordFailedAttempt("test@example.com");
    }
    expect(requiresCaptcha("test@example.com")).toBe(true);

    clearAttempts("test@example.com");
    expect(requiresCaptcha("test@example.com")).toBe(false);
  });

  test("getAttemptsInfo returns correct remaining count", () => {
    recordFailedAttempt("test@example.com");
    recordFailedAttempt("test@example.com");

    const info = getAttemptsInfo("test@example.com");
    expect(info.remaining).toBe(MAX_FAILED_ATTEMPTS - 2);
    expect(info.requiresCaptcha).toBe(false);
  });

  test("getAttemptsInfo returns defaults for unknown email", () => {
    const info = getAttemptsInfo("unknown@example.com");
    expect(info.remaining).toBe(MAX_FAILED_ATTEMPTS);
    expect(info.requiresCaptcha).toBe(false);
  });

  test("normalizes email case", () => {
    recordFailedAttempt("Test@Example.COM");
    recordFailedAttempt("test@example.com");
    recordFailedAttempt("TEST@EXAMPLE.COM");

    expect(requiresCaptcha("test@example.com")).toBe(true);
  });

  test("handles null/empty email gracefully", () => {
    expect(requiresCaptcha(null)).toBe(false);
    expect(requiresCaptcha("")).toBe(false);
    recordFailedAttempt(null);
    recordFailedAttempt("");
  });
});
