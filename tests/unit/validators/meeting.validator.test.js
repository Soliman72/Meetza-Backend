const meetingValidator = require("../../../src/validators/meetingValidator");

describe("meetingValidator", () => {
  test("validateMeetingIdParam throws when id missing", () => {
    expect(() => meetingValidator.validateMeetingIdParam("")).toThrow(
      "Meeting id is required"
    );
  });

  test("validateStatusValue accepts Scheduled", () => {
    expect(() => meetingValidator.validateStatusValue("Scheduled")).not.toThrow();
  });
});
