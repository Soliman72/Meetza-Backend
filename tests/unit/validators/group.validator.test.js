const groupValidator = require("../../../src/validators/groupValidator");

describe("groupValidator", () => {
  test("validateCreateGroup throws for missing fields", () => {
    expect(() => groupValidator.validateCreateGroup({})).toThrow();
  });

  test("normalizePendingGroupStatus maps 1 and 0", () => {
    expect(groupValidator.normalizePendingGroupStatus("1")).toBe("approved");
    expect(groupValidator.normalizePendingGroupStatus("0")).toBe("rejected");
  });
});
