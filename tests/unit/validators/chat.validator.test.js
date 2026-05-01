const chatValidator = require("../../../src/validators/chatValidator");

describe("chatValidator", () => {
  test("requireUserId throws when user is missing", () => {
    expect(() => chatValidator.requireUserId(null)).toThrow("Unauthorized");
  });

  test("validateEmoji trims and returns value", () => {
    expect(chatValidator.validateEmoji("  👍  ")).toBe("👍");
  });
});
