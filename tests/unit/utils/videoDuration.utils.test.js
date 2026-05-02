const { createVideoDuration } = require("../../../src/utils/videoDuration");

describe("createVideoDuration", () => {
  test("parses valid integer", async () => {
    expect(await createVideoDuration(120)).toBe(120);
  });

  test("parses string number", async () => {
    expect(await createVideoDuration("300")).toBe(300);
  });

  test("returns 0 for NaN", async () => {
    expect(await createVideoDuration("abc")).toBe(0);
  });

  test("returns 0 for null", async () => {
    expect(await createVideoDuration(null)).toBe(0);
  });

  test("returns 0 for negative values", async () => {
    expect(await createVideoDuration(-5)).toBe(0);
  });
});
