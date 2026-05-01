const { isAdminAccess } = require("../../../src/utils/authorization");

describe("isAdminAccess", () => {
  test("returns true for Member accessing dashboard", () => {
    expect(isAdminAccess({ role: "Member" }, "dashboard")).toBe(true);
  });

  test("returns false for Administrator accessing dashboard", () => {
    expect(isAdminAccess({ role: "Administrator" }, "dashboard")).toBe(false);
  });

  test("returns false for Super_Admin accessing dashboard", () => {
    expect(isAdminAccess({ role: "Super_Admin" }, "dashboard")).toBe(false);
  });

  test("returns false when from is not dashboard", () => {
    expect(isAdminAccess({ role: "Member" }, "home")).toBe(false);
  });

  test("returns false when from is undefined", () => {
    expect(isAdminAccess({ role: "Member" }, undefined)).toBe(false);
  });

  test("returns false when from is null", () => {
    expect(isAdminAccess({ role: "Member" }, null)).toBe(false);
  });
});
