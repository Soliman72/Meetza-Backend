const { sanitizeAlias } = require("../../../src/utils/sqlSanitizeAlias");

describe("sanitizeAlias", () => {
  test("returns alias when it is in allowed list", () => {
    expect(sanitizeAlias("v", ["v"])).toBe("v");
  });

  test("returns default when alias is not allowed", () => {
    expect(sanitizeAlias("x", ["v"])).toBe("v");
  });

  test("returns default for null alias", () => {
    expect(sanitizeAlias(null, ["v"])).toBe("v");
  });

  test("returns default for undefined alias", () => {
    expect(sanitizeAlias(undefined, ["v"])).toBe("v");
  });

  test("returns default for non-string alias", () => {
    expect(sanitizeAlias(123, ["v"])).toBe("v");
  });

  test("works with multiple allowed values", () => {
    expect(sanitizeAlias("m", ["v", "m"])).toBe("m");
    expect(sanitizeAlias("x", ["v", "m"])).toBe("v");
  });
});
