jest.mock("../../../src/utils/videoVisibility", () => ({
  getVideoVisibility: jest.fn(),
}));
jest.mock("../../../src/utils/videoWatchProgressFields", () => ({
  mapWatchProgressFromRow: jest.fn(),
}));
jest.mock("../../../src/utils/videoSearch", () => ({
  buildVideoSearchCondition: jest.fn(),
}));
jest.mock("../../../src/services/chatMessageService", () => ({
  buildUnreadTotalQuery: jest.fn(),
}));
jest.mock("../../../src/repositories/homeRepository", () => ({
  countVideosWithVisibility: jest.fn(),
  countMeetingsSuperAdmin: jest.fn(),
  countMeetingsAdministrator: jest.fn(),
  countMeetingsMember: jest.fn(),
  countGroupsSuperAdmin: jest.fn(),
  countGroupsAdministrator: jest.fn(),
  countGroupsMember: jest.fn(),
  countUnreadMessages: jest.fn(),
  countSavedVideosByMember: jest.fn(),
  findUpcomingMeetingsByScope: jest.fn(),
  findMostInterestedVideos: jest.fn(),
  findHomeLeadersByScope: jest.fn(),
  findHomeSavedVideos: jest.fn(),
}));
jest.mock("../../../src/validators/homeValidator", () => ({
  requireAuthenticatedUser: jest.fn(),
  assertHomeMeetingsRole: jest.fn(),
  parseUpcomingLimit: jest.fn(() => 10),
  parseUpcomingSearch: jest.fn(() => "term"),
  parseMostInterestedLimit: jest.fn(() => 5),
  parseLeadersLimit: jest.fn(() => 6),
  parseSavedVideosLimit: jest.fn(() => 7),
  isHomeMeetingsRole: jest.fn(),
  UPCOMING_DEFAULT_LIMIT: 10,
  UPCOMING_MAX_LIMIT: 50,
  MOST_INTERESTED_DEFAULT_LIMIT: 5,
  MOST_INTERESTED_MAX_LIMIT: 30,
  LEADERS_DEFAULT_LIMIT: 6,
  LEADERS_MAX_LIMIT: 20,
  SAVED_VIDEOS_DEFAULT_LIMIT: 7,
  SAVED_VIDEOS_MAX_LIMIT: 30,
}));

const { getVideoVisibility } = require("../../../src/utils/videoVisibility");
const { mapWatchProgressFromRow } = require("../../../src/utils/videoWatchProgressFields");
const { buildVideoSearchCondition } = require("../../../src/utils/videoSearch");
const { buildUnreadTotalQuery } = require("../../../src/services/chatMessageService");
const repo = require("../../../src/repositories/homeRepository");
const service = require("../../../src/services/homeService");

describe("homeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getVideoVisibility.mockReturnValue({ whereClause: "v.scope='x'", params: ["p1"] });
    buildUnreadTotalQuery.mockReturnValue({
      sql: "SELECT 1",
      params: (userId) => [userId],
    });
    buildVideoSearchCondition.mockReturnValue({ clause: "v.title LIKE ?", params: ["%term%"] });
    mapWatchProgressFromRow.mockReturnValue({ progress: 22 });
  });

  test("getHomeStatsData by role", async () => {
    repo.countVideosWithVisibility.mockResolvedValue(3);
    repo.countMeetingsSuperAdmin.mockResolvedValue(11);
    repo.countGroupsSuperAdmin.mockResolvedValue(8);
    repo.countUnreadMessages.mockResolvedValue(4);
    repo.countSavedVideosByMember.mockResolvedValue(2);

    const superReq = { user: { id: "u1", role: "Super_Admin" } };
    await expect(service.getHomeStatsData(superReq)).resolves.toEqual({
      video_sessions: 3,
      meetings: 11,
      groups: 8,
      group_chat_unread: 4,
      saved_videos: 2,
    });

    repo.countMeetingsAdministrator.mockResolvedValue(9);
    repo.countGroupsAdministrator.mockResolvedValue(6);
    const adminReq = { user: { id: "u2", role: "Administrator" } };
    await service.getHomeStatsData(adminReq);
    expect(repo.countMeetingsAdministrator).toHaveBeenCalledWith("u2");
    expect(repo.countGroupsAdministrator).toHaveBeenCalledWith("u2");

    repo.countMeetingsMember.mockResolvedValue(5);
    repo.countGroupsMember.mockResolvedValue(2);
    const memberReq = { user: { id: "u3", role: "Member" } };
    await service.getHomeStatsData(memberReq);
    expect(repo.countMeetingsMember).toHaveBeenCalledWith("u3");
    expect(repo.countGroupsMember).toHaveBeenCalledWith("u3");
  });

  test("getUpcomingMeetings delegates by scope", async () => {
    repo.findUpcomingMeetingsByScope.mockResolvedValue([{ id: "m1" }]);
    const req = { user: { id: "u1", role: "Administrator" }, query: { limit: "4", q: "abc" } };
    await expect(service.getUpcomingMeetings(req)).resolves.toEqual([{ id: "m1" }]);
    expect(repo.findUpcomingMeetingsByScope).toHaveBeenCalledWith("u1", "Administrator", 10, "term");
  });

  test("getMostInterestedVideos builds where and maps payload", async () => {
    repo.findMostInterestedVideos.mockResolvedValue([
      {
        id: "v1",
        poster_url: "poster",
        watch_status: "watching",
        watch_progress_percentage: 80,
        likes_count: "3",
        comments_count: "4",
        saved_count: "5",
        interest_score: "9",
      },
    ]);
    const req = { user: { id: "u1", role: "Member" }, query: { q: "abc" } };
    const out = await service.getMostInterestedVideos(req);
    expect(repo.findMostInterestedVideos).toHaveBeenCalled();
    expect(out[0]).toEqual(
      expect.objectContaining({
        thumbnail_url: "poster",
        likes_count: 3,
        comments_count: 4,
        saved_count: 5,
        interest_score: 9,
      })
    );
  });

  test("getHomeLeaders and getHomeSavedVideos map rows", async () => {
    repo.findHomeLeadersByScope.mockResolvedValue([
      { leader_id: "l1", name: "Leader", user_photo: "p", position_id: "p1", position_title: "Owner" },
    ]);
    const req = { user: { id: "u1", role: "Administrator" }, query: {} };
    await expect(service.getHomeLeaders(req)).resolves.toEqual([
      {
        id: "l1",
        name: "Leader",
        user_photo: "p",
        position: { id: "p1", title: "Owner" },
      },
    ]);

    repo.findHomeSavedVideos.mockResolvedValue([
      {
        id: "v1",
        title: "Video",
        poster_url: "pp",
        duration: 90,
        group_id: "g1",
        group_name: "G",
        saved_at: "now",
        watch_status: "watching",
        watch_progress_percentage: "40",
      },
    ]);
    const saved = await service.getHomeSavedVideos(req);
    expect(saved[0]).toEqual(
      expect.objectContaining({
        id: "v1",
        thumbnail_url: "pp",
        progress_percentage: 40,
        watch_progress: { progress: 22 },
      })
    );
  });
});
