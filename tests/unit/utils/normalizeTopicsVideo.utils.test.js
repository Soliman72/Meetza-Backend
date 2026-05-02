const { normalizeTopics } = require("../../../src/utils/normalizeTopicsVideo");

describe("normalizeTopics", () => {
  test("returns null for null input", () => {
    expect(normalizeTopics(null)).toBeNull();
  });

  test("returns null for undefined input", () => {
    expect(normalizeTopics(undefined)).toBeNull();
  });

  test("returns array as-is", () => {
    expect(normalizeTopics(["a", "b"])).toEqual(["a", "b"]);
  });

  test("parses JSON array string", () => {
    expect(normalizeTopics('["topic1","topic2"]')).toEqual(["topic1", "topic2"]);
  });

  test("returns non-array string as-is", () => {
    expect(normalizeTopics("just a string")).toBe("just a string");
  });

  test("returns non-array JSON as the original string", () => {
    expect(normalizeTopics('{"key":"value"}')).toBe('{"key":"value"}');
  });

  test("returns invalid JSON string as-is", () => {
    expect(normalizeTopics("not json [")).toBe("not json [");
  });

  test("returns other types as-is", () => {
    expect(normalizeTopics(42)).toBe(42);
  });
});
