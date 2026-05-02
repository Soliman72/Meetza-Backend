const groupValidator = require("../../../src/validators/groupValidator");

describe("groupValidator", () => {
  describe("normalizePendingGroupStatus", () => {
    test("maps '1' to approved", () => {
      expect(groupValidator.normalizePendingGroupStatus("1")).toBe("approved");
    });

    test("maps '0' to rejected", () => {
      expect(groupValidator.normalizePendingGroupStatus("0")).toBe("rejected");
    });

    test("returns null for unknown value", () => {
      expect(groupValidator.normalizePendingGroupStatus("maybe")).toBeNull();
    });

    test("handles null input", () => {
      expect(groupValidator.normalizePendingGroupStatus(null)).toBeNull();
    });
  });

  describe("validateCreateGroup", () => {
    test("throws for missing fields", () => {
      expect(() => groupValidator.validateCreateGroup({})).toThrow();
    });

    test("throws for invalid year", () => {
      expect(() =>
        groupValidator.validateCreateGroup({
          group_name: "G1",
          year: "5",
          semester: "Fall",
          group_content_name: "Content",
        })
      ).toThrow("Invalid year");
    });

    test("throws for invalid semester", () => {
      expect(() =>
        groupValidator.validateCreateGroup({
          group_name: "G1",
          year: "1",
          semester: "Winter",
          group_content_name: "Content",
        })
      ).toThrow("Invalid semester");
    });

    test("passes for valid data", () => {
      expect(() =>
        groupValidator.validateCreateGroup({
          group_name: "G1",
          year: "2",
          semester: "Spring",
          group_content_name: "Content",
        })
      ).not.toThrow();
    });
  });

  describe("validateAddAdmin", () => {
    test("throws for missing fields", () => {
      expect(() => groupValidator.validateAddAdmin({})).toThrow();
    });

    test("throws for invalid role", () => {
      expect(() =>
        groupValidator.validateAddAdmin({ groupId: "g1", userId: "u1", role: "HACKER" })
      ).toThrow("Invalid role");
    });

    test("passes for valid ADMIN role", () => {
      expect(() =>
        groupValidator.validateAddAdmin({ groupId: "g1", userId: "u1", role: "ADMIN" })
      ).not.toThrow();
    });
  });

  describe("validateLeaveGroup", () => {
    test("throws for missing fields", () => {
      expect(() => groupValidator.validateLeaveGroup({})).toThrow();
    });

    test("passes for valid data", () => {
      expect(() =>
        groupValidator.validateLeaveGroup({ groupId: "g1", userId: "u1" })
      ).not.toThrow();
    });
  });
});
