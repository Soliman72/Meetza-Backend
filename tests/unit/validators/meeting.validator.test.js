jest.mock("../../../src/utils/meetingQueryFilter", () => ({
  parseWeeklyFlag: jest.fn((v) => {
    if (v === undefined || v === null || v === "") return false;
    const s = String(v).toLowerCase();
    return s === "true" || s === "1";
  }),
}));

const meetingValidator = require("../../../src/validators/meetingValidator");

describe("meetingValidator", () => {
  describe("validateMeetingIdParam", () => {
    test("throws when id missing", () => {
      expect(() => meetingValidator.validateMeetingIdParam("")).toThrow(
        "Meeting id is required"
      );
    });

    test("throws for null", () => {
      expect(() => meetingValidator.validateMeetingIdParam(null)).toThrow();
    });

    test("passes for valid id", () => {
      expect(() => meetingValidator.validateMeetingIdParam("m1")).not.toThrow();
    });
  });

  describe("validateStatusValue", () => {
    test("accepts Scheduled", () => {
      expect(() => meetingValidator.validateStatusValue("Scheduled")).not.toThrow();
    });

    test("accepts Completed", () => {
      expect(() => meetingValidator.validateStatusValue("Completed")).not.toThrow();
    });

    test("accepts Cancelled", () => {
      expect(() => meetingValidator.validateStatusValue("Cancelled")).not.toThrow();
    });

    test("rejects invalid status", () => {
      expect(() => meetingValidator.validateStatusValue("Pending")).toThrow();
    });
  });

  describe("validateRecordingIfPresent", () => {
    test("passes for null", () => {
      expect(() => meetingValidator.validateRecordingIfPresent(null)).not.toThrow();
    });

    test("passes for empty string", () => {
      expect(() => meetingValidator.validateRecordingIfPresent("")).not.toThrow();
    });

    test("passes for '1'", () => {
      expect(() => meetingValidator.validateRecordingIfPresent("1")).not.toThrow();
    });

    test("passes for '0'", () => {
      expect(() => meetingValidator.validateRecordingIfPresent("0")).not.toThrow();
    });

    test("throws for invalid value", () => {
      expect(() => meetingValidator.validateRecordingIfPresent("2")).toThrow(
        "Recording must be 1 or 0"
      );
    });
  });

  describe("validateDateRange", () => {
    test("validates correct date range", () => {
      const result = meetingValidator.validateDateRange(
        "2025-06-01T10:00:00Z",
        "2025-06-01T12:00:00Z",
        {}
      );
      expect(result.newStart).toBeInstanceOf(Date);
      expect(result.newEnd).toBeInstanceOf(Date);
    });

    test("throws when start is after end", () => {
      expect(() =>
        meetingValidator.validateDateRange(
          "2025-06-01T14:00:00Z",
          "2025-06-01T12:00:00Z",
          {}
        )
      ).toThrow("end_time must be after start_time");
    });

    test("uses fallback when start_time is null", () => {
      const result = meetingValidator.validateDateRange(null, "2025-06-01T14:00:00Z", {
        start_time: "2025-06-01T10:00:00Z",
        end_time: "2025-06-01T12:00:00Z",
      });
      expect(result.newStart).toBeInstanceOf(Date);
    });
  });

  describe("assertAuthenticatedUserId", () => {
    test("throws for null userId", () => {
      expect(() => meetingValidator.assertAuthenticatedUserId(null)).toThrow("Unauthorized");
    });

    test("passes for valid userId", () => {
      expect(() => meetingValidator.assertAuthenticatedUserId("u1")).not.toThrow();
    });
  });
});
