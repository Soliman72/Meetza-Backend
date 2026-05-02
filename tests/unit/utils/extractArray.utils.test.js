const { extractArray } = require("../../../src/utils/extractArray");

describe("extractArray", () => {
  test("returns empty array for null body", () => {
    expect(extractArray(null, "tags")).toEqual([]);
  });

  test("extracts array value directly", () => {
    expect(extractArray({ tags: ["a", "b"] }, "tags")).toEqual(["a", "b"]);
  });

  test("parses JSON array string", () => {
    expect(extractArray({ tags: '["x","y"]' }, "tags")).toEqual(["x", "y"]);
  });

  test("splits comma-separated string", () => {
    expect(extractArray({ tags: "a, b, c" }, "tags")).toEqual(["a", "b", "c"]);
  });

  test("wraps non-array non-string value", () => {
    expect(extractArray({ tags: 42 }, "tags")).toEqual(["42"]);
  });

  test("collects indexed keys like tags[0], tags[1]", () => {
    const body = { "tags[0]": "first", "tags[1]": "second" };
    expect(extractArray(body, "tags")).toEqual(["first", "second"]);
  });

  test("deduplicates results", () => {
    expect(extractArray({ tags: ["a", "a", "b"] }, "tags")).toEqual(["a", "b"]);
  });

  test("returns empty array when key is missing", () => {
    expect(extractArray({ other: "val" }, "tags")).toEqual([]);
  });
});
