const { normalizeToArray } = require("../../../src/utils/normalize");

describe("normalize utility", () => {
  test("normalizes comma-separated values", () => {
    expect(normalizeToArray("a, b, c")).toEqual(["a", "b", "c"]);
  });
});
