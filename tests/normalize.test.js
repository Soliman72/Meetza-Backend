const { normalizeToArray, normalizeAndValidate } = require("../src/utils/normalize");

describe("normalize utils", () => {
  describe("normalizeToArray", () => {
    test("returns empty array for falsy value", () => {
      expect(normalizeToArray(null)).toEqual([]);
      expect(normalizeToArray("")).toEqual([]);
    });

    test("keeps truthy values from array input", () => {
      expect(normalizeToArray(["A", "", "B", null])).toEqual(["A", "B"]);
    });

    test("splits comma-separated string and trims values", () => {
      expect(normalizeToArray(" one, two , ,three ")).toEqual(["one", "two", "three"]);
    });

    test("wraps non-string, non-array value in array", () => {
      expect(normalizeToArray(7)).toEqual([7]);
    });
  });

  describe("normalizeAndValidate", () => {
    const allowed = ["a", "b", "c"];

    test("returns only allowed values from string input", () => {
      expect(normalizeAndValidate("a, b, d", allowed)).toEqual(["a", "b"]);
    });

    test("returns only allowed values from array input", () => {
      expect(normalizeAndValidate(["a", "x", "c"], allowed)).toEqual(["a", "c"]);
    });

    test("returns empty array for unsupported input types", () => {
      expect(normalizeAndValidate({ value: "a" }, allowed)).toEqual([]);
    });
  });
});
