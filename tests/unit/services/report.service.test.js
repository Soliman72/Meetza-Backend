jest.mock("../../../src/repositories/reportRepository", () => ({
  getMinUserCreatedAt: jest.fn(),
  findAccessibleGroups: jest.fn(),
  findMeetingsInPeriod: jest.fn(),
  findVideosInPeriod: jest.fn(),
  countMembershipsInPeriod: jest.fn(),
  countMeetingsInPeriod: jest.fn(),
  countVideosInPeriod: jest.fn(),
  countGroupsInPeriod: jest.fn(),
  countMessagesInPeriod: jest.fn(),
  countMeetingAttendanceInPeriod: jest.fn(),
  findGroupsDetailed: jest.fn(),
  findRecentReviews: jest.fn(),
  findRecentMembers: jest.fn(),
  findGroupMembershipActivityByPeriod: jest.fn(),
  findMeetingJoinActivityByPeriod: jest.fn(),
  findVideoWatchActivityByPeriod: jest.fn(),
}));
jest.mock("../../../src/validators/reportValidator", () => ({
  assertStartBeforeEnd: jest.fn(),
  resolveTrendDateFormat: jest.fn(),
}));

const reportRepo = require("../../../src/repositories/reportRepository");
const reportValidator = require("../../../src/validators/reportValidator");
const service = require("../../../src/services/reportService");

describe("reportService.getAnalyticsReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reportValidator.resolveTrendDateFormat.mockReturnValue({
      groupBy: "day",
      mysqlDateFormat: "%Y-%m-%d",
    });
  });

  test("returns empty payload when no accessible groups", async () => {
    reportRepo.getMinUserCreatedAt.mockResolvedValue("2024-01-01");
    reportRepo.findAccessibleGroups.mockResolvedValue([]);
    const req = {
      query: {},
      user: { id: "u1", role: "Administrator" },
      isSuperAdmin: false,
    };
    const out = await service.getAnalyticsReport(req);
    expect(out).toEqual({
      empty: true,
      message: "No groups found.",
      data: null,
    });
  });

  test("builds analytics payload for non-empty groups", async () => {
    const req = {
      query: { startDate: "2026-01-01", endDate: "2026-01-03" },
      user: { id: "u1", role: "Administrator" },
      isSuperAdmin: false,
    };
    reportRepo.findAccessibleGroups.mockResolvedValue([{ id: "g1" }]);
    reportRepo.findMeetingsInPeriod.mockResolvedValue([
      { status: "completed", recording: "1", duration: 30, attendeeCount: 5, poster_url: "m1" },
    ]);
    reportRepo.findVideosInPeriod.mockResolvedValue([
      {
        id: "v1",
        duration_seconds: 100,
        avgProgressSeconds: 50,
        viewerCount: 2,
        completionCount: 1,
        poster_url: "v1",
      },
    ]);
    reportRepo.countMembershipsInPeriod.mockResolvedValue(10);
    reportRepo.countMeetingsInPeriod.mockResolvedValue(1);
    reportRepo.countVideosInPeriod.mockResolvedValue(2);
    reportRepo.countGroupsInPeriod.mockResolvedValue(1);
    reportRepo.countMessagesInPeriod.mockResolvedValue(3);
    reportRepo.countMeetingAttendanceInPeriod.mockResolvedValue(4);
    reportRepo.findGroupsDetailed.mockResolvedValue([
      {
        id: "g1",
        created_at: "2026-01-02",
        group_photo: "gp",
        totalMessages: 7,
        totalComments: 3,
        totalLikes: 2,
      },
    ]);
    reportRepo.findRecentReviews.mockResolvedValue([{ id: "r1" }]);
    reportRepo.findRecentMembers.mockResolvedValue([{ id: "m1", user_photo: "up" }]);
    reportRepo.findGroupMembershipActivityByPeriod.mockResolvedValue([
      { period: "2026-01-01", count: 2 },
    ]);
    reportRepo.findMeetingJoinActivityByPeriod.mockResolvedValue([
      { period: "2026-01-01", count: 3 },
    ]);
    reportRepo.findVideoWatchActivityByPeriod.mockResolvedValue([
      { period: "2026-01-01", count: 4 },
    ]);

    const out = await service.getAnalyticsReport(req);
    expect(out.empty).toBe(false);
    expect(out.data.summary.totalGroups.numbers).toBe(1);
    expect(out.data.summary.totalMembers.numbers).toBe(10);
    expect(out.data.summary.totalMeetings.numbers).toBe(1);
    expect(out.data.summary.totalVideos.numbers).toBe(1);
    expect(out.data.summary.totalReviews).toBe(5);
    expect(out.data.comparison.meetings.previous).toBe(1);
    expect(out.data.distributions.meetingStatus.completed).toBe(1);
    expect(out.data.videos[0]).toEqual(
      expect.objectContaining({
        avgProgressPercent: 50,
        completionRate: 50,
      })
    );
    expect(out.data.activityTrends.length).toBeGreaterThan(0);
  });
});
