const { getRequestedLocalization } = require("../../../src/utils/localization");

describe("getRequestedLocalization", () => {
  test("defaults to ar when no header", () => {
    const req = { header: () => undefined };
    expect(getRequestedLocalization(req)).toBe("ar");
  });

  test("returns ar for Arabic header", () => {
    const req = { header: () => "ar" };
    expect(getRequestedLocalization(req)).toBe("ar");
  });

  test("returns en for English header", () => {
    const req = { header: () => "en" };
    expect(getRequestedLocalization(req)).toBe("en");
  });

  test("handles uppercase input", () => {
    const req = { header: () => "EN" };
    expect(getRequestedLocalization(req)).toBe("en");
  });

  test("falls back to ar for unsupported locale", () => {
    const req = { header: () => "fr" };
    expect(getRequestedLocalization(req)).toBe("ar");
  });

  test("trims whitespace", () => {
    const req = { header: () => "  en  " };
    expect(getRequestedLocalization(req)).toBe("en");
  });
});
