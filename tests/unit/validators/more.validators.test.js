const reportValidator = require("../../../src/validators/reportValidator");
const profileValidator = require("../../../src/validators/profileValidator");
const memberValidator = require("../../../src/validators/memberValidator");
const { validateFileType } = require("../../../src/validators/validateFiles");
const videoWatchProgressValidator = require("../../../src/validators/videoWatchProgressValidator");

describe("additional validators", () => {
  test("reportValidator resolves date format and validates range", () => {
    expect(reportValidator.resolveTrendDateFormat(true, 1)).toEqual({
      groupBy: "month",
      mysqlDateFormat: "%Y-%m",
    });
    expect(reportValidator.resolveTrendDateFormat(false, 120)).toEqual({
      groupBy: "month",
      mysqlDateFormat: "%Y-%m",
    });
    expect(reportValidator.resolveTrendDateFormat(false, 30)).toEqual({
      groupBy: "day",
      mysqlDateFormat: "%Y-%m-%d",
    });

    expect(() =>
      reportValidator.assertStartBeforeEnd(
        new Date("2026-01-01"),
        new Date("2026-01-01")
      )
    ).not.toThrow();

    expect(() =>
      reportValidator.assertStartBeforeEnd(
        new Date("2026-01-02"),
        new Date("2026-01-01")
      )
    ).toThrow("startDate must be before or equal to endDate");
  });

  test("profileValidator requires authenticated user", () => {
    expect(() => profileValidator.requireAuthenticatedUser({ user: { id: "u1" } })).not.toThrow();
    expect(() => profileValidator.requireAuthenticatedUser({})).toThrow(
      "Unauthorized: user not found"
    );
  });

  test("memberValidator handles create/id/update validations", () => {
    expect(() => memberValidator.validateCreateMember({ user_id: "u1" })).not.toThrow();
    expect(() => memberValidator.validateCreateMember({})).toThrow();

    expect(() => memberValidator.validateMemberIdParam("u1")).not.toThrow();
    expect(() => memberValidator.validateMemberIdParam(" ")).toThrow();

    expect(() => memberValidator.validateUpdateMember("u1", "u2")).not.toThrow();
    expect(() => memberValidator.validateUpdateMember("", "u2")).toThrow();
    expect(() => memberValidator.validateUpdateMember("u1", "")).toThrow();
  });

  test("validateFiles supports url/file object and rejects invalid types", () => {
    expect(() => validateFileType("https://x.com/file.mp4", "video")).not.toThrow();
    expect(() =>
      validateFileType({ originalname: "photo.png" }, "image")
    ).not.toThrow();

    expect(() => validateFileType("https://x.com/file.txt", "video")).toThrow(
      "Invalid video format. Only video files allowed."
    );
    expect(() =>
      validateFileType({ originalname: "doc.pdf" }, "image")
    ).toThrow("Invalid image format. Only image files allowed.");
  });

  test("videoWatchProgressValidator validates user and upsert body", () => {
    expect(() => videoWatchProgressValidator.requireUserId("u1")).not.toThrow();
    expect(() => videoWatchProgressValidator.requireUserId(null)).toThrow(
      "Unauthorized: user not found"
    );

    expect(
      videoWatchProgressValidator.parseUpsertBody({ progress_seconds: 12.8 })
    ).toEqual({ progress_seconds: 12, completed: undefined });

    expect(videoWatchProgressValidator.parseUpsertBody({ completed: 1 })).toEqual({
      progress_seconds: undefined,
      completed: true,
    });

    expect(() => videoWatchProgressValidator.parseUpsertBody({})).toThrow(
      "Provide progress_seconds and/or completed"
    );
    expect(() =>
      videoWatchProgressValidator.parseUpsertBody({ progress_seconds: -2 })
    ).toThrow("progress_seconds must be a non-negative integer");
  });
});
