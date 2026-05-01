const notificationValidator = require("../../../src/validators/notificationValidator");

describe("notificationValidator", () => {
  test("validateNotificationIdParam throws when id is empty", () => {
    expect(() => notificationValidator.validateNotificationIdParam("")).toThrow(
      "Notification id is required"
    );
  });

  test("createNotificationValidator validates required fields", async () => {
    await expect(
      notificationValidator.createNotificationValidator({
        memberId: "m1",
        senderId: "s1",
        title: "Test",
        message: "Body",
      })
    ).resolves.toBeUndefined();
  });
});
