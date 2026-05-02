const notificationValidator = require("../../../src/validators/notificationValidator");

describe("notificationValidator", () => {
  describe("validateNotificationIdParam", () => {
    test("throws when id is empty", () => {
      expect(() => notificationValidator.validateNotificationIdParam("")).toThrow(
        "Notification id is required"
      );
    });

    test("throws for null", () => {
      expect(() => notificationValidator.validateNotificationIdParam(null)).toThrow();
    });

    test("throws for whitespace-only", () => {
      expect(() => notificationValidator.validateNotificationIdParam("   ")).toThrow();
    });

    test("passes for valid id", () => {
      expect(() => notificationValidator.validateNotificationIdParam("n1")).not.toThrow();
    });
  });

  describe("createNotificationValidator", () => {
    test("validates required fields", async () => {
      await expect(
        notificationValidator.createNotificationValidator({
          memberId: "m1",
          senderId: "s1",
          title: "Test",
          message: "Body",
        })
      ).resolves.toBeUndefined();
    });

    test("throws when memberId is missing", async () => {
      await expect(
        notificationValidator.createNotificationValidator({
          senderId: "s1",
          title: "Test",
          message: "Body",
        })
      ).rejects.toThrow("Missing fields");
    });

    test("throws when title is missing", async () => {
      await expect(
        notificationValidator.createNotificationValidator({
          memberId: "m1",
          senderId: "s1",
          message: "Body",
        })
      ).rejects.toThrow("Missing fields");
    });

    test("throws for null input", async () => {
      await expect(
        notificationValidator.createNotificationValidator(null)
      ).rejects.toThrow("Missing fields");
    });
  });
});
