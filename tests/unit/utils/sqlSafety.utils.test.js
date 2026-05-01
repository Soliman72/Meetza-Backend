const { assertSafeSqlFragment, resolveSafeDateFormat } = require("../../../src/utils/sqlSafety");

describe("assertSafeSqlFragment", () => {
  test("passes for safe WHERE clause", () => {
    expect(() => assertSafeSqlFragment("WHERE id = ?")).not.toThrow();
  });

  test("passes for empty/null input", () => {
    expect(() => assertSafeSqlFragment("")).not.toThrow();
    expect(() => assertSafeSqlFragment(null)).not.toThrow();
    expect(() => assertSafeSqlFragment(undefined)).not.toThrow();
  });

  test("throws for semicolons", () => {
    expect(() => assertSafeSqlFragment("DROP TABLE; --")).toThrow("Unsafe");
  });

  test("throws for SQL comments --", () => {
    expect(() => assertSafeSqlFragment("WHERE 1=1 --hack")).toThrow("Unsafe");
  });

  test("throws for block comments /*", () => {
    expect(() => assertSafeSqlFragment("/* comment */")).toThrow("Unsafe");
  });

  test("includes label in error message", () => {
    expect(() => assertSafeSqlFragment("id;", "myField")).toThrow("Unsafe myField");
  });
});

describe("resolveSafeDateFormat", () => {
  test("returns %Y-%m-%d for day format", () => {
    expect(resolveSafeDateFormat("%Y-%m-%d")).toBe("%Y-%m-%d");
  });

  test("returns %Y-%m for month format", () => {
    expect(resolveSafeDateFormat("%Y-%m")).toBe("%Y-%m");
  });

  test("throws for unknown format", () => {
    expect(() => resolveSafeDateFormat("%Y")).toThrow("Invalid mysqlDateFormat");
  });

  test("throws for arbitrary string", () => {
    expect(() => resolveSafeDateFormat("DROP TABLE")).toThrow("Invalid mysqlDateFormat");
  });
});
