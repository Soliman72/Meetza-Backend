const chatValidator = require("../../../src/validators/chatValidator");

describe("chatValidator", () => {
  describe("requireUserId", () => {
    test("throws when user is missing", () => {
      expect(() => chatValidator.requireUserId(null)).toThrow("Unauthorized");
    });

    test("passes for valid user id", () => {
      expect(() => chatValidator.requireUserId("u1")).not.toThrow();
    });
  });

  describe("requireGroupId", () => {
    test("throws when groupId is missing", () => {
      expect(() => chatValidator.requireGroupId(null)).toThrow("groupId is required");
    });

    test("passes for valid group id", () => {
      expect(() => chatValidator.requireGroupId("g1")).not.toThrow();
    });
  });

  describe("requireGroupAndMessageIds", () => {
    test("throws when groupId missing", () => {
      expect(() => chatValidator.requireGroupAndMessageIds(null, "m1")).toThrow();
    });

    test("throws when messageId missing", () => {
      expect(() => chatValidator.requireGroupAndMessageIds("g1", null)).toThrow();
    });

    test("passes for valid ids", () => {
      expect(() => chatValidator.requireGroupAndMessageIds("g1", "m1")).not.toThrow();
    });
  });

  describe("validateSearchMessage", () => {
    test("returns null for undefined", () => {
      expect(chatValidator.validateSearchMessage(undefined)).toBeNull();
    });

    test("throws for empty string", () => {
      expect(() => chatValidator.validateSearchMessage("")).toThrow("cannot be empty");
    });

    test("throws for too long message", () => {
      const longStr = "a".repeat(201);
      expect(() => chatValidator.validateSearchMessage(longStr)).toThrow("200 characters");
    });

    test("returns trimmed string for valid input", () => {
      expect(chatValidator.validateSearchMessage("  hello  ")).toBe("hello");
    });
  });

  describe("validateEmoji", () => {
    test("trims and returns value", () => {
      expect(chatValidator.validateEmoji("  👍  ")).toBe("👍");
    });

    test("throws for empty emoji", () => {
      expect(() => chatValidator.validateEmoji("")).toThrow("emoji is required");
    });

    test("throws for null emoji", () => {
      expect(() => chatValidator.validateEmoji(null)).toThrow("emoji is required");
    });
  });

  describe("validateMeetingDate", () => {
    test("returns null for falsy value", () => {
      expect(chatValidator.validateMeetingDate("start", null)).toBeNull();
    });

    test("returns Date for valid date string", () => {
      const result = chatValidator.validateMeetingDate("start", "2025-06-15");
      expect(result).toBeInstanceOf(Date);
    });

    test("throws for invalid date", () => {
      expect(() => chatValidator.validateMeetingDate("start", "not-a-date")).toThrow(
        "Invalid 'start' date"
      );
    });
  });
});
